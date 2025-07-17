# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the src directory into the container at /app
COPY ./src .

# Make port 8002 available to the world outside this container
EXPOSE 8002

# Run main.py when the container launches
# Use --host 0.0.0.0 to make it accessible from other Docker containers
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]