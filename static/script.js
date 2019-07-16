document.addEventListener('DOMContentLoaded', () => {
    // check if new user
    checkUser();

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
        const message = document.getElementById('message-input').value;
        if(message != ''){
            const room = document.querySelector('.selected').dataset.name;
            const user = localStorage.getItem('flack-user');
            sendMessage(message, user, room);
            document.getElementById('message-input').value = '';
        }
    });
});

function sendMessage(message, user, room){
    const request = new XMLHttpRequest();
    request.open('POST', '/add-message');

    request.onload = () => {
        console.log('res', request.responseText)
        const response = JSON.parse(request.responseText);

        if(response.success){
            const messageHTML = buildMessageHTML(user, message);
            const noMessagesDOM = document.querySelector('.no-messages-found');
            const messagesDOM = document.querySelector('.messages');
            if(messagesDOM.contains(noMessagesDOM)) messagesDOM.innerHTML = messageHTML;
            else messagesDOM.innerHTML += messageHTML;
        }
    }

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
                content += buildMessageHTML(message.user, message.content);
            });
        }


        document.querySelector('.messages').innerHTML = content;
    }

    request.send();
}

function buildMessageHTML(user, message){
    return `
        <li class="media my-4">
            <img class="mr-3" src="https://image.flaticon.com/icons/png/512/149/149071.png" alt="Generic placeholder image">
            <div class="media-body">
            <h5 class="mt-0 mb-1">${user}</h5>
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

    request.onload = () => {
        const response = JSON.parse(request.responseText);
        if (response.success) {
            const li = document.createElement('li');
            li.innerHTML = roomName;
            li.setAttribute('data-name', roomName);
            li.classList.add('list-group-item');
            li.addEventListener('click', () => {
                whenRoomClicked(li);
            })
            document.querySelector('.rooms').append(li);
        } else {
            alert(response.message);
        }
    }

    const data = new FormData();
    data.append('room', roomName);
    request.send(data);
}