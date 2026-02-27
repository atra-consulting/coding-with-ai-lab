#!/bin/bash

echo "=== CRM Application Starter ==="

# Check prerequisites
if ! command -v mvn &> /dev/null; then
    echo "ERROR: Maven (mvn) is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi

# Set JAVA_HOME to Java 21 if available
if [ -d "/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home" ]; then
    export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home"
    echo "Using Java 21: $JAVA_HOME"
elif [ -d "$(brew --prefix openjdk@21 2>/dev/null)/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
    echo "Using Java 21 (Homebrew): $JAVA_HOME"
fi

# Cleanup function
cleanup() {
    echo ""
    echo "Shutting down..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "Backend stopped"
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "Frontend stopped"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend..."
cd "$(dirname "$0")/backend"
mvn spring-boot:run &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in $(seq 1 60); do
    if curl -s http://localhost:8080/api/firmen > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "ERROR: Backend failed to start within 60 seconds"
        cleanup
    fi
    sleep 2
done

# Start frontend
echo "Starting frontend..."
cd "$(dirname "$0")/frontend"
npx ng serve --proxy-config proxy.conf.json &
FRONTEND_PID=$!
cd ..

echo ""
echo "=== CRM Application Started ==="
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:4200"
echo "H2 Console: http://localhost:8080/h2-console"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait
