/*
 *  Created a Table with name todo in the todoApplication.db file using the CLI.
 */

// importing important module
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

// creating path for database
const databasePath = path.join(__dirname, "todoApplication.db");

// assigning express server to app
const app = express();

app.use(express.json());

// assigning null values to database connection object
let database = null;

// defining initializeDbAndServer function
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

// calling initializeDbAndServer function
initializeDbAndServer();

// function to check whether priority and status properties are available in request query or not
// this function will return true or false value
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

// function to check whether priority property are available in request query or not
// this function will return true or false value
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

// function to check whether status property are available in request query or not
// this function will return true or false value
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// API to get all todo based on request query
app.get("/todos/", async (request, response) => {
  //here we initaialising data with null also getTodosQuery with empty string
  let data = null;
  let getTodosQuery = "";
  // extracring all properties from request query from url
  const { search_q = "", priority, status } = request.query;

  // now we are applying conditional switch case to get right choice Query for what we have in our request Query in url
  // In result we have value in getTodoQuery
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }
  // applying Query on database
  data = await database.all(getTodosQuery);
  // and finally sending the response
  response.send(data);
});

// API to get specific todo based on todoId
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

// API to add new todo in our database
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  // extracting todo from request parameter
  const { todoId } = request.params;
  // initially updateColumn variable to empty string value
  let updateColumn = "";
  // all content of request body is assigned in requestBody variable
  const requestBody = request.body;
  // here we are updating the updateColumn variable by using requestBody
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  // collecting previousTodo data
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  // extracting all data from request body and also assigning the undefined value for any property from previousTodo
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  // writing Query for updating a specific Todo based on todoId
  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;
  // running Query on database
  await database.run(updateTodoQuery);
  // sending response
  response.send(`${updateColumn} Updated`);
});

//API to delete specific todo based on todoID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

//Finally exporting the app
module.exports = app;
