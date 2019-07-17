import os
from os import path, walk
from datetime import datetime
import time

from flask import Flask, jsonify, request
from flask import render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.debug = True
socketio = SocketIO(app)

rooms = [
    # {
    #     "name": "Room 1",
    #     "messages": [
    #         {
    #             "user": "User 1",
    #             "timestamp": time.mktime(datetime.now().timetuple()),
    #             "content": "bla bla bla!"
    #         }
    #     ]
    # },
    # {
    #     "name": "Room 2",
    #     "messages": [
    #         {
    #             "user": "User 1",
    #             "timestamp": time.mktime(datetime.now().timetuple()),
    #             "content": "bla bla bla!"
    #         },
    #         {
    #             "user": "User 2",
    #             "timestamp": time.mktime(datetime.now().timetuple()),
    #             "content": "bla bla bla!"
    #         },
    #     ]
    # },
]

@app.route("/")
def index():
    return render_template('index.html', rooms = rooms)

@app.route("/load-messages-for-room/<room>")
def load_messages_by_room(room):
    messages = []
    for r in rooms:
        if(r["name"] == room):
            messages = r["messages"]
    return jsonify(messages)

@app.route("/add-room", methods=['POST'])
def add_room():
    room = request.form.get("room")
    exist = False
    for r in rooms:
        if(r["name"] == room):
            exist = True
    if(exist):
        return jsonify({"success": False, "message": "Room already exist"})
    else:
        rooms.append({
            "name": room,
            "messages": []
        })
    socketio.emit('NEW_ROOM_RECIEVED', {"roomName": room}, broadcast=True)
    return jsonify({"success": True})

@app.route("/add-message", methods=['POST'])
def add_message():  
    room = request.form.get("room")
    user = request.form.get("user")
    message = request.form.get("message")

    for r in rooms:
        if(r["name"] == room):
            r["messages"].append({
                "user": user,
                "timestamp": time.mktime(datetime.now().timetuple()),
                "content": message
            })
    socketio.emit('NEW_MESSAGE_RECIEVED', {"message": message, "user": user, "room": room, "timestamp": time.mktime(datetime.now().timetuple())}, broadcast=True)
    return jsonify({"success": True})


# @socketio.on("NEW_ROOM_SUBMITTED")
# def vote(data):
#     roomName = data["roomName"]
#     emit('NEW_ROOM_RECIEVED', {"roomName": roomName}, broadcast=True)


# @socketio.on("NEW_MESSAGE_SUBMITTED")
# def vote(data):
#     emit('NEW_MESSAGE_RECIEVED', {"message": data["message"], "user": data["user"], "room": data["room"], "timestamp": time.mktime(datetime.now().timetuple())}, broadcast=True)



if __name__ == '__main__':
    app.run()
