# Kinematic

Gestionnaire de contenaire docker créer dans le cadre du cours Déploiement de solutions

## Installation

Cloner le projet :

```
git clone https://github.com/Warziikx/mds-kinematic.git
```

Placer vous dans le dossier du projet et Créer l'image docker :

```
docker build --rm -f "dockerfile" -t kinematic:latest .
```

### Sous Windows AVEC Machine Virtuel / ou / sous Linux ( Environnement de développement / Testé)

Dans cette configuration les contenaires sont créer dans une machine virtuel tournant sous linux,
il faut donc lancer le contenaire en partageant le fichier "docker.sock" situé dans /var/run/

Lancer le conteneur :

```
docker run --name kinematic -v /var/run:/var/run -p 3000:3000/tcp kinematic:latest
```

Ensuite lancer Docker QuickStart Terminal pour connaitre l'IP de votre VM
Il suffit d'acceder au site via cette IP sans oublié de rajouter " :3000 " à la fin de l'adresse

### Sous Windows SANS Machine Virtuel (Non Testé)

Dans cette configuration il faudra décommenter la ligne 4 du fichier docker.js situé dans bin/docker.js et commenter la ligne 3
Il suffit ensuite de lancer le contenaire ainsi :

```
docker run --name kinematic -p 3000:3000/tcp kinematic:latest
```

Vous pouvez ensuite accéder au site avec l'adresse :

```
http://localhost:3000
```

### Sous MAC (Non Testé et inconnu)

Mélanger les options ci-dessus et voir ce qui fonctionne 😅 GL HF 😉
