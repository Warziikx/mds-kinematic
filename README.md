# Kinematic


Commande pour créer l'imagedocker :

- docker build --rm -f "dockerfile" -t kinematic:latest .

Commande pour lancer le dock :

- docker run --name nginx -v /var/run:/var/run -p 3000:3000/tcp kinematic:latest
