#!/bin/bash
docker run -v /home/ubuntu/ec2-audiowmark-test/data:/data --rm -i audiowmark add test.wav test-out.wav 0123456789abcdef0011223344556677