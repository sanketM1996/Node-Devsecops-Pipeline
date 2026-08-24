const db = require("../config/db");

const getUsers = (callback) => {
    db.query("SELECT * FROM users", callback);
};

const addUser = (user, callback) => {
    db.query(
        "INSERT INTO users (name, email, role) VALUES (?, ?, ?)",
        [user.name, user.email, user.role],
        callback
    );
};

const updateUser = (id, user, callback) => {
    db.query(
        "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
        [
            user.name,
            user.email,
            user.role,
            id
        ],
        callback
    );
};

const deleteUser = (id, callback) => {
    db.query(
        "DELETE FROM users WHERE id = ?",
        [id],
        callback
    );
};

module.exports = {
    getUsers,
    addUser,
    updateUser,
    deleteUser
};