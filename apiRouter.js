const express = require("express");
const app = express.Router();
const pool = require("./pgConfig");
const empSchema = require("./tableSchema/employee");
const designationSchema = require("./tableSchema/designation");
const residentSchema = require("./tableSchema/resident");

app.get("/view", async function (req, res) {
  const queries = {
    employee: "SELECT * FROM employee",
    designation: "SELECT * FROM designation",
    resident: "SELECT * FROM resident",
  };

  const result = {};

  await Promise.all(Object.keys(queries).map(executeQuery))
    .then(() => {
      res.json({ status: 200, data: result });
    })
    .catch((err) => {
      res.json({ status: 400, data: err });
    });

  async function executeQuery(table) {
    let tableColumns =
      table === "designation"
        ? designationSchema["tableColumns"]
        : table === "resident"
        ? residentSchema["tableColumns"]
        : empSchema["tableColumns"];
    return new Promise(async (resolve, reject) => {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS ${table} (${Object.entries(tableColumns)
          .map(([key, value]) => `${key} ${value}`)
          .join(", ")})`
      );
      pool.query(queries[table], (err, data) => {
        if (err) {
          reject(err);
        } else {
          result[table] = data.rows;

          resolve();
        }
      });
    });
  }
});

app.post("/add", async function (req, res) {
  try {
    const { tableName, tableColumns } = empSchema;
    const columns = Object.entries(tableColumns)
      .map(([key, value]) => `${key} ${value}`)
      .join(", ");
    // Create the table if it doesn't exist
    await pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`);

    // Insert data into the table and retrieve the inserted record
    const userData = {
      username: req.body.username,
      email: req.body.email,
    };
    const keys = Object.keys(userData).join(", ");
    const values = Object.values(userData)
      .map((value) => (typeof value === "string" ? `'${value}'` : value))
      .join(", ");

    let result = await pool.query(
      `INSERT INTO ${tableName} (${keys}) VALUES (${values}) RETURNING *`
    );

    res.json({
      message: "Data inserted successfully.",
      status: 200,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", status: 500 });
  }
});

app.post("/resident/add", async function (req, res) {
  try {
    // Define table schema and name
    const employeeTableName = "employee";
    const residentTableName = "resident"; // Change the variable name

    // Ensure the resident table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${residentTableName} (
        id SERIAL PRIMARY KEY,
        address VARCHAR(255),
        employee_id INT REFERENCES ${employeeTableName}(id)
      )
    `);

    // Insert data into the resident table
    const userData = {
      address: req.body.address,
      employee_id: req.body.id, // Assuming you get employee_id in the request body
    };

    await pool.query(
      `INSERT INTO ${residentTableName} (${Object.keys(userData).join(
        ", "
      )}) VALUES (${Object.values(userData)
        .map((value) => (typeof value === "string" ? `'${value}'` : value))
        .join(", ")})`
    );

    res.json({ message: "Data inserted successfully.", status: 200 });
  } catch (error) {
    res.status(500).json({
      message: error["detail"] || "Internal Server Error",
      status: 500,
    });
  }
});
app.post("/emloyeer/add", async function (req, res) {
  try {
    // Define table schema and name
    const employeeTableName = "employee";
    const designationTableName = "designation";

    // Ensure the designation table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${designationTableName} (
        id SERIAL PRIMARY KEY,
        designation VARCHAR(255),
        employee_id INT REFERENCES ${employeeTableName}(id)
      )
    `);

    // Insert data into the designation table
    const userData = {
      designation: req.body.designation,
      employee_id: req.body.id, // Assuming you get employee_id in the request body
    };

    await pool.query(
      `INSERT INTO ${designationTableName} (${Object.keys(userData).join(
        ", "
      )}) VALUES (${Object.values(userData)
        .map((value) => (typeof value === "string" ? `'${value}'` : value))
        .join(", ")})`
    );

    res.json({ message: "Data inserted successfully.", status: 200 });
  } catch (error) {
    res.status(500).json({
      message: error["detail"] || "Internal Server Error",
      status: 500,
    });
  }
});

app.delete("/delete/:id", async function (req, res) {
  try {
    const tableName = "employee";
    const idToDelete = req.params.id;

    // Check if the record with the given ID exists before attempting to delete
    const checkExistenceQuery = `SELECT EXISTS (SELECT 1 FROM ${tableName} WHERE id = $1)`;
    const recordExists = await pool.query(checkExistenceQuery, [idToDelete]);

    if (recordExists.rows[0].exists) {
      // Delete the record with the specified ID
      const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1`;
      await pool.query(deleteQuery, [idToDelete]);

      res.json({ message: "Record deleted successfully." });
    } else {
      res.status(404).json({ message: "Record not found." });
    }
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

app.put("/edit/:id", async function (req, res) {
  try {
    const tableName = "employee";
    const idToUpdate = req.params.id;
    const updatedData = req.body; // Assuming the updated data is sent in the request body

    // Check if the record with the given ID exists before attempting to update
    const checkExistenceQuery = `SELECT EXISTS (SELECT 1 FROM ${tableName} WHERE id = $1)`;
    const recordExists = await pool.query(checkExistenceQuery, [idToUpdate]);

    if (recordExists.rows[0].exists) {
      // Update the record with the specified ID
      const updateQuery = `UPDATE ${tableName} SET ${Object.keys(updatedData)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(", ")} WHERE id = $${Object.keys(updatedData).length + 1}`;

      const values = [...Object.values(updatedData), idToUpdate];

      await pool.query(updateQuery, values);

      res.json({ message: "Record updated successfully." });
    } else {
      res.status(404).json({ message: "Record not found." });
    }
  } catch (error) {
    res.json({ message: "Something went wrong." });
  }
});

module.exports = app;
