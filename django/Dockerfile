# Use an official Python runtime as a parent image
FROM python:3.10-alpine

# Set the working directory in the container to /code
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install channels_redis
RUN pip install Twisted[http2,tls]

# Make port 7000 available to the world outside this container
EXPOSE 7000
WORKDIR /code
# Run manage.py when the container launches

# CMD [daphne, "-b", "0.0.0.0", "-p", "7000", "v2","backend.asgi:application"]