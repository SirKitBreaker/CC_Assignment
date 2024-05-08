# Add the base image for Ubuntu
FROM ubuntu:latest

# Run the commands to create a new directory
WORKDIR /usr/vim

# Update the packages
RUN apt update

# Install vim
RUN apt install vim -y

# Set the starting point for the container
ENTRYPOINT [ "/bin/bash" ]