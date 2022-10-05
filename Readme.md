# Express API Template
## Updates Ongoing


This template provides automated options to make development easier.
Template still on progress and might have some errors.

## Features

- Database model generation for ORM (Powered by Sequelize)
- Auto generate documentation
- Data Validation and Filtering
- Role Based Access Control
- Editing Validation and documentation in single file

## Tech

This template used some library to work properly:

- [Sequelize] - Database ORM for NodeJS
- [Swagger] - Documentation
- [Swagger-JSDoc] - Documentation template
- [Nodemon] - Script Monitoring
- [Multer] - File I/O Handler

And many more, you can check it on package.json.

## Installation

This template requires [Node.js](https://nodejs.org/) v12+ to run.

Install the dependencies and devDependencies and start the server.

```sh
npm i
npm start
```

For production environments...

```sh
npm i --production
node server.js
```

## Features

Features list and status (With upcoming features)

| Features | Status |
| ------ | ------ |
| Autodocumentation | Ready |
| Database Model Generation | Ready |
| Unit Testing | Error |
| Data Validation | Ready |
| Route Versioning | Pending |

## Commands
To run some commands, use below
```sh
node manage.js <command>
```
List of command

| Command | Description |
| ------ | ------ |
| createroute | Create new route |
| generatedocs | Generate documentation |
| generatenodemon | Generate Nodemon.json file |
| dbmodelgenerate | Generate Database ORM Model |
| help | Show Commands List |

## Database Compatibility

List of Database Dialect Tested

| Database | Migration | Application |
| ------ | ------ | ------ |
| MySQL | Not Tested | Ready |
| PostgreSQL | Ready | Ready |
| SQLite | Not Tested | Not Tested |

## Features in Environment

List of Features in each environment

| Environment | API Documentation | Database Migrations | Unit Test | Authorization |
| ------ | ------ | ------ | ------ | ------ |
| Development | v | v | v | v |
| Production | - | v | - | v |
| Staging | - | v | v | v |

## Upcoming Features

List of Features pending

- Unit Testing
- API Versioning (v1/v2/etc)
- Dynamic Documentation
- Support NoSQL

