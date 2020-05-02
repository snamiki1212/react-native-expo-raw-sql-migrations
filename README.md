# react-native-expo-raw-sql-migrations

SQLite migration System to use raw SQL for expo managed react native app.
Implemented with React Hooks and TypeScript.

## Installation

```zsh
yarn add react-native-expo-raw-sql-migrations
# or
npm install --save react-native-expo-raw-sql-migrations
```

## Usage

### Normal Way

Automatically migrate.

1. Ready to DB object and migration JSON schema.
2. Wrap with Provider Component.
3. Handle to fetch DB with `useMigrate` custom hook.

```tsx
// app.tsx
import React from 'react'
import { MigrationProvider, Migration } from "react-native-expo-raw-sql-migrations";
import * as SQLite from "expo-sqlite";

// 1) Ready to db and migration.
export const db = SQLite.openDatabase("myApp.db", "1"); // args are dbname, db-version.
export const migrations: Migration[] = [
  {
    name: "202004021800",
    query:
      "CREATE TABLE cycles (id TEXT PRIMARY KEY, startedAt TEXT, endedAt TEXT, createdAt TEXT, updatedAt TEXT)",
  },
  {
    name: "202004022100",
    query:
      "CREATE TABLE kpts (id TEXT PRIMARY KEY, cycleID TEXT, type TEXT, text TEXT, createdAt TEXT, updatedAt TEXT, FOREIGN KEY(cycleID) REFERENCES cycles(id))",
  },
];

// 2) Wrap provider
const App = () => {
  return(
    <MigrationProvider db={db} migrations={migrations}>
      { /* children components ... */ }
    </MigrationProvider>
  )
}

export default App;
```

```tsx
// SomethingComponent.tsx
import React from 'react'
import { useMigrate } from "react-native-expo-raw-sql-migrations";

const fetchUser = () => { /* fetch data from db */ }

export const SomethingComponent = () => {
  // isFinished as flag will be true after migration.
  const { isFinished } = useMigrate()

  React.useEffect(() => {
    // 3) Handle operation for db.
    //    These operation for db should execute after migration.
    if(isFinished){
      fetchUser()
    }
  }, [isFinished, fetchUser])
}

```


### Custom Way

If you would like to handle migration logic yourself, pass starts bootstrap handle options to Provider Component. e.g`<MigrationProvider options={{ startsBootstrap: false }}>{...}</MigrationProvider>`

## Used by

This app is used by [Keputo - KPT method - Keep/Problem/Try](https://keputo.snamiki1212.com/) as expo mobile app.

## etc

- Inspierd by [GitHub - langleyfoxall/react-native-expo-sql-migrations](https://github.com/langleyfoxall/react-native-expo-sql-migrations).
