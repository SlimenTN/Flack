import os
from os import path, walk

from flask import Flask, jsonify, request
from flask import render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)
app.debug = True

rooms = [
    {
        "name": "Room 1",
        "messages": [
            {
                "user": "User 1",
                "content": "bla bla bla!"
            }
        ]
    },
    {
        "name": "Room 2",
        "messages": [
            {
                "user": "User 1",
                "content": "bla bla bla!"
            },
            {
                "user": "User 2",
                "content": "bla bla bla!"
            },
        ]
    },
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
                "content": message
            })
    return jsonify({"success": True})

def run_server():
    extra_dirs = ['tempaltes','static',]
    extra_files = extra_dirs[:]
    for extra_dir in extra_dirs:
        for dirname, dirs, files in walk(extra_dir):
            for filename in files:
                filename = path.join(dirname, filename)
                if path.isfile(filename):
                    extra_files.append(filename)
    app.run(extra_files=extra_files)  

if __name__ == '__main__':
    run_server()
