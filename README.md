A collaborative Project. The team consists of:\
Dragos @dragoshiz\
Vlad @Vangirov\
Pablo @Pandaero\
Max @mwagner86\
Trung @Alohakaloha

<h2> Transcendence - last project in the Core Curriculum</h2>
A single-page-application offering a pong game and tournament function.
The project offers freedom in how to implement features within the available modules.
The base requirement is to have 7 major modules. 2 minor modules make 1 major module.
Our chosen modules and functionalities are following:


<h3>[Web] Django as Backend (major) </h3>


> In this major module, you are required to utilize a specific web framework for your
> backend development, and that framework is Django

<h3>[Web] Bootstrap Toolkit (minor)</h3>

>Use a front-end framework or toolkit.\
>Your frontend development will utilize the Bootstrap toolkit

<h3>[Web] Use a database for the backend -and more (minor) </h3>

>The designated database for all DB instances in your project is PostgreSQL.\
>This choice guarantees data consistency and compatibility across all project components and may be a prerequisite for other modules, such as the backend Framework module.

<h3>[User Management] Use a database for the backend -and more (major) </h3>

>Users can subscribe to the website in a secure way.\
>◦ Registered users can log in in a secure way.\
>◦ Users can select a unique display name to play the tournaments.\
>◦ Users can update their information.\
>◦ Users can upload an avatar, with a default option if none is provided.\
>◦ Users can add others as friends and view their online status.\
>◦ User profiles display stats, such as wins and losses.\
>◦ Each user has a Match History including 1v1 games, dates, and relevant
>details, accessible to logged-in users


<h3>[User Management] Remote Authentication (Major) </h3>

>In this major module, the goal is to implement the following authentication system:
>OAuth 2.0 authentication with 42 . Key features and objectives include:

>◦ Integrate the authentication system, allowing users to securely sign in.\
>◦ Obtain the necessary credentials and permissions from the authority to enable a secure login.\
>◦ Implement user-friendly login and authorization flows that adhere to best practices and security standards.\
>◦ Ensure the secure exchange of authentication tokens and user information between the web application and the authentication provider


<h3>[Accessibility] Server Sided Rendering (minor) </h3>

>◦ Develop server-side logic for the Pong game to handle gameplay, ball movement, scoring, and player interactions.\
>◦ Create an API that exposes the necessary resources and endpoints to interactwith the Pong game, allowing partial usage of the game via the Command-Line
>Interface (CLI) and web interface.\
>◦ Design and implement the API endpoints to support game initialization, playercontrols, and game state updates.\
>◦ Ensure that the server-side Pong game is responsive, providing an engagingand enjoyable gaming experience.\
>◦ Integrate the server-side Pong game with the web application, allowing usersto play the game directly on the website.

<h3>[Accessibility] Server Sided Pong (Major) </h3>


>◦ Develop server-side logic for the Pong game to handle gameplay, ball movement, scoring, and player interactions.\
>◦ Create an API that exposes the necessary resources and endpoints to interact with the Pong game, allowing partial usage of the game via the Command-Line Interface (CLI) and web interface.\
>◦ Design and implement the API endpoints to support game initialization, player controls, and game state updates.\
>◦ Ensure that the server-side Pong game is responsive, providing an engaging and enjoyable gaming experience.\
>◦ Integrate the server-side Pong game with the web application, allowing users to play the game directly on the website.


>This major module aims to elevate the Pong game by migrating it to the server
>side, enabling interaction through both a web interface and CLI while offering an
>API for easy access to game resources and features.

<h3>[Gameplay and user experience] Game Customization Options (minor) </h3>


>◦ Offer customization features, such as power-ups, attacks, or different maps, that enhance the gameplay experience.\
>◦ Allow users to choose a default version of the game with basic features if they prefer a simpler experience.\
>◦ Ensure that customization options are available and applicable to all games offered on the platform.\
>◦ Implement user-friendly settings menus or interfaces for adjusting game parameters.\
>◦ Maintain consistency in customization features across all games to provide a unified user experience.

<h3>[Gameplay and user experience] Remote players (major) </h3>

>It is possible to have two distant players. Each player is located on a separated
computer, accessing the same website and playing the same Pong game.

<h3>[Gameplay and user experience] Live-Chat (major) </h3>

>◦ The user should be able to send direct messages to other users.\
>◦ The user should be able to block other users. This way, they will see no more messages from the account they blocked.\
>◦ The user should be able to invite other users to play a Pong game through the chat interface.\
>◦ The tournament system should be able to warn users expected for the next game.\
>◦ The user should be able to access other players profiles through the chat interface.

## ELK

### Inspiration sourses

https://www.youtube.com/watch?v=jXU_1GADENQ

https://github.com/ayounes9/elk-on-docker

### Problems with Docker Memory resourses

https://github.com/laradock/laradock/issues/1699#issuecomment-404738158

Run `sudo sysctl -w vm.max_map_count=262144` in the terminal, not in the docker




## TODO CHAT
 - message model for private messages
 - load last messages when opening up a private message
 - system message when user is not connected
 - unblock button in frontend
 - block and unblock message model
 - block functionality
 - invite to game button in frontend
 - game invite functionality
 - refactor
 - bugfix frontend