// declaring global variable for socket
var socket;

document.addEventListener('DOMContentLoaded', () => {
    // check if new user
    checkUser();

    // check if user clicked on a room before
    rememberRoom();

    // init socket.io
    initSocketIO();

    // add click event on rooms
    document.querySelectorAll('.list-group-item').forEach((roomDOM) => {
        roomDOM.addEventListener('click', () => {
            whenRoomClicked(roomDOM);
        })
    });

    // add click event on "add-room" button
    document.getElementById('add-room').addEventListener('click', () => {
        let room = prompt('Write a name for the new room.');
        addNewRoom(room);
    });

    // add click event to "send-message" button
    document.getElementById('send-message').addEventListener('click', () => {
        prepareMessageToBeSent();
    });

    // add keyup event on message input
    document.getElementById('message-input').addEventListener('keyup', (event) => {
        if (event.keyCode == 13) prepareMessageToBeSent();
    });
});

function rememberRoom(){
    let oldRoom = localStorage.getItem('room');
    console.log('oldRoom', oldRoom);
    if(oldRoom){
        document.querySelectorAll('.list-group-item').forEach((roomDOM) => {
            if(oldRoom == roomDOM.dataset.name){
                whenRoomClicked(roomDOM);
            }
        });
    }
}

function prepareMessageToBeSent(){
    const message = document.getElementById('message-input').value;
    if(message != ''){
        const room = document.querySelector('.selected').dataset.name;
        const user = localStorage.getItem('flack-user');
        sendMessage(message, user, room);
        document.getElementById('message-input').value = '';
    }
}

function sendMessage(message, user, room){
    const request = new XMLHttpRequest();
    request.open('POST', '/add-message');

    const data = new FormData();
    data.append('room', room);
    data.append('user', user);
    data.append('message', message);

    request.send(data);
}

function checkUser(){
    if(localStorage.getItem('flack-user') === null){
        const user = prompt('Welcome to Flack, what\'s your nickname ?');
        if(user == null || user == ''){
            alert('In order to user Flack you need to write a nickname!');
            checkUser();
            
        }
        else{
            localStorage.setItem('flack-user', user)
            alert(`Welcome ${user}, have fun using Flack :)`);
        }
    }
}

function whenRoomClicked(roomDOM){
    document.getElementById('message-input').disabled = false;
    document.getElementById('send-message').disabled = false;
    toggleSelectedClass(roomDOM);
    let roomName = roomDOM.dataset.name;
    localStorage.setItem('room', roomName);
    loadRoomMessages(roomName);
}

function loadRoomMessages(roomName) {
    const request = new XMLHttpRequest();
    request.open('GET', `/load-messages-for-room/${roomName}`);
    document.getElementById('room-name').innerHTML = roomName;
    request.onload = () => {
        const messages = JSON.parse(request.responseText);
        let content = '';
        if (messages.length == 0) {
            content = '<li class="no-messages-found">No messages found!</li>'
        } else {
            messages.forEach((message) => {
                content += buildMessageHTML(message.user, message.content, message.timestamp);
            });
        }


        document.querySelector('.messages').innerHTML = content;
    }

    request.send();
}

function buildMessageHTML(user, message, timestamp){
    let date = dateFormat(new Date(timestamp*1000), "dddd, mmmm dS, yyyy, h:MM:ss TT");
    return `
        <li class="media my-4">
            <img class="mr-3" src="https://image.flaticon.com/icons/png/512/149/149071.png" alt="Generic placeholder image">
            <div class="media-body">
            <h5 class="mt-0 mb-1">${user}</h5>
            <span class="message-date"><i>${date}</i></span><br>
            ${message}
            </div>
        </li>
    `;
}

function toggleSelectedClass(selectedRoomDOM) {
    document.querySelectorAll('.list-group-item').forEach((roomDOM) => {
        roomDOM.classList.remove('selected');
    });
    selectedRoomDOM.classList.add('selected')
}

function addNewRoom(roomName) {
    const request = new XMLHttpRequest();
    request.open('POST', '/add-room');

    /* request.onload = () => {
        const response = JSON.parse(request.responseText);
        if (response.success) {
            socket.emit('NEW_ROOM_SUBMITTED', {'roomName': roomName});
        } else {
            alert(response.message);
        }
    } */

    const data = new FormData();
    data.append('room', roomName);
    request.send(data);
}

function initSocketIO(){
    socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    // socket.on('connect', () => {
    //     console.log('socket initialized!');
        
    // });

    socket.on('NEW_ROOM_RECIEVED', (data) => {
        const li = document.createElement('li');
        li.innerHTML = data.roomName;
        li.setAttribute('data-name', data.roomName);
        li.classList.add('list-group-item');
        li.addEventListener('click', () => {
            whenRoomClicked(li);
        })
        document.querySelector('.rooms').append(li);
    });

    socket.on('NEW_MESSAGE_RECIEVED', (data) => {
        let currentRoom = document.querySelector('.selected').dataset.name;
        console.log('currentRoom', currentRoom)
        if(data.room == currentRoom){
            const messageHTML = buildMessageHTML(data.user, data.message, data.timestamp);
            const noMessagesDOM = document.querySelector('.no-messages-found');
            const messagesDOM = document.querySelector('.messages');
            if(messagesDOM.contains(noMessagesDOM)) messagesDOM.innerHTML = messageHTML;
            else messagesDOM.innerHTML += messageHTML;
        }
    });
}