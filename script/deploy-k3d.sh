#!/bin/bash
set -euo pipefail

CLUSTER_NAME="uds"
IMAGE_NAME="agentboard-web"
NAMESPACE="default"

echo "=== AgentBoard Web K3D Deployment ==="

# Check if k3d cluster exists and start it if needed
if ! k3d cluster list "$CLUSTER_NAME" &>/dev/null; then
    echo "Creating k3d cluster: $CLUSTER_NAME"
    k3d cluster create "$CLUSTER_NAME" \
        --servers 1 \
        --agents 0 \
        --port "8080:80@loadbalancer" \
        --no-lb
else
    # Check if cluster is running
    SERVERS=$(k3d cluster list "$CLUSTER_NAME" -o json | grep -o '"serversRunning":[0-9]*' | cut -d: -f2 || echo "0")
    if [ "$SERVERS" = "0" ] || [ -z "$SERVERS" ]; then
        echo "Starting k3d cluster: $CLUSTER_NAME"
        k3d cluster start "$CLUSTER_NAME"
    fi
fi

echo "Building Docker image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME:latest" -f packages/app/Dockerfile .

echo "Importing image into k3d cluster: $CLUSTER_NAME"
k3d image import "$IMAGE_NAME:latest" -c "$CLUSTER_NAME"

echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/deployment.yaml -n "$NAMESPACE"
kubectl apply -f k8s/service.yaml -n "$NAMESPACE"

echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/agentboard-web -n "$NAMESPACE" --timeout=120s

echo ""
echo "=== Deployment Complete ==="
echo "Access AgentBoard Web at: http://localhost:8080"
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl logs -n $NAMESPACE -l app=agentboard-web"
echo "  kubectl port-forward -n $NAMESPACE svc/agentboard-web 3000:80"
