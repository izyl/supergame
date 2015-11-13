SUPERGAME
---------------

##TODO :

###Web site : angular
- [x] chat
- [x] enable/disable fps
- [] enable/disable map
- [] Menus bootstrap retractables avec chat et preferences
- [] Preferences clavier souris
- [-] in game chat (default key enter) : partie + team + private + global

###Jeu

####Server : express, socket.io
- [x] stockage de la partie, joueurs, attribution d'id
- [] routage des informations par paquets
- [] reconciliation
- [] vie/mort/respawn
- [] salons/parties
- [] equipes
- [] partie : win/loose
- [] stockage utilisateurs/mdp -> MongoDB

####Client : three.js, socket.io-client
- [] level manager : load unload scene
- [x] stats
- [] vue carte map
- [] prediction
- [x] collision 
- [] test(raycaster vs box)
- [x] pesanteur : bot collision
- [x] obstacles : front collision
- [] attaque
- [] IA -> pnj
- [] path finding	
- [] bonus
- [] login
- [x] remote player local instance destroy sur leave
	
####Infographie : Blender
- [x] courir
- [] sauter
- [] accroupir
- [] frapper
- [] changements d'anim en douceur
- [-] des textures
	
	
##references
	[exporting from blender to threejs](https://quaintproject.wordpress.com/2014/01/25/exporting-from-blender-to-web-gl-using-collada-and-three-js-part-2)
	[game networking fast paced multiplayer](http://gabrielgambetta.com/fast_paced_multiplayer.html)