const userModel = require("../models/userModel");

const getUsers = (req, res) => {
    userModel.getUsers((err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.status(200).json(results);
    });
};

const addUser = (req, res) => {
    userModel.addUser(req.body, (err, result) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.status(201).json({
            id: result.insertId,
            ...req.body
        });
    });
};

const updateUser = (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;

    userModel.updateUser(
        id,
        { name, email, role },
        (err, result) => {
            if (err) {
                console.error("Update user error:", err);

                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            res.status(200).json({
                id: Number(id),
                name,
                email,
                role
            });
        }
    );
};

const deleteUser = (req, res) => {
    userModel.deleteUser(req.params.id, (err, result) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "User deleted"
        });
    });
};

module.exports = {
    getUsers,
    addUser,
    updateUser,
    deleteUser
};