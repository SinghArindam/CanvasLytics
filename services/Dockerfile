# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the consolidated requirements file
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the source code for ALL services into the container
COPY ./agent/src/ ./agent
COPY ./pandas-eda/src/ ./pandas-eda
COPY ./sklearn-lab/src/ ./sklearn-lab

# Add the service directories to the Python path so imports work correctly
ENV PYTHONPATH="/app"