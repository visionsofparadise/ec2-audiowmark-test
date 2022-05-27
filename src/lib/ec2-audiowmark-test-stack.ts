import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cwLogs from "aws-cdk-lib/aws-logs";

export class Ec2AudiowmarkTestStack extends Stack {
  get availabilityZones(): string[] {
    return [
      "us-east-1a",
      "us-east-1b",
      "us-east-1c",
      "us-east-1d",
      "us-east-1e",
      "us-east-1f",
    ];
  }

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      natGateways: 0,
      cidr: "10.0.0.0/16",
      maxAzs: 2,
    });

    const logGroup = new cwLogs.LogGroup(this, `LogGroup`, {
      retention: cwLogs.RetentionDays.ONE_WEEK,
    });

    const instance = new ec2.Instance(this, `EC2Instance`, {
      instanceName: "audiowmark-test",
      vpc,
      vpcSubnets: {
        subnets: vpc.publicSubnets,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.SMALL
      ),
      machineImage: ec2.MachineImage.genericLinux({
        "us-east-1": "ami-09e67e426f25ce0d7",
      }),
      allowAllOutbound: true,
      blockDevices: [
        {
          deviceName: "/dev/sda1",
          volume: ec2.BlockDeviceVolume.ebs(10),
        },
      ],
      userData: ec2.UserData.forLinux({
        shebang: `#!/bin/bash

sudo apt-get update
sudo apt install nodejs npm -y
sudo apt-get install ca-certificates curl gnupg lsb-release -y
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
sudo usermod -aG docker ubuntu
sudo systemctl enable docker.service
sudo systemctl enable containerd.service

git clone https://github.com/swesterfeld/audiowmark.git
cd audiowmark
sudo docker build -t audiowmark .
cd ..

git clone https://github.com/visionsofparadise/ec2-audiowmark-test.git
cd ec2-audiowmark-test
npm i
npm run build

LOG_GROUP_NAME=${logGroup.logGroupName} node dist/service/index.js
`,
      }),
      userDataCausesReplacement: true,
    });

    logGroup.grantWrite(instance.grantPrincipal);
  }
}
