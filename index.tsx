import React from "react";
import * as SQLite from "expo-sqlite";

/**
 * Types
 */
export type Migration = {
  name: string;
  query: string;
};

type Options = {
  tableName?: string;
  columnName?: string;
};

type DB = SQLite.WebSQLDatabase;

/**
 * Constants
 */
const DEFAULT_TABLE_NAME = "migrations";
const DEFAULT_COLUMN_NAME = "versions";

/**
 * Logics
 */
const MigrationContext = React.createContext({
  isFinished: false,
  execute: undefined,
});

export const useMigrate = () => React.useContext(MigrationContext);

const Bootstrap: React.FC<{ db: DB; migrations: Migration[], startsBootstrap: boolean }> = ({
  children,
  db,
  migrations,
  startsBootstrap
}) => {
  const { execute, isFinished } = useMigrate();

  React.useEffect(() => {
    if(!startsBootstrap) return;
    if (isFinished) return;
    execute(db, migrations);
  }, [execute, isFinished]);

  return <>{children}</>;
};

export const MigrationProvider: React.FC<{
  db: DB;
  migrations: Migration[];
  options?: { startsBootstrap: boolean };
}> = ({ children, db, migrations, options }) => {
  const _startsBootstrap = options?.startsBootstrap || true;

  return (
    <MigrationBaseProvider>
      <Bootstrap db={db} migrations={migrations} startsBootstraop={_startsBootstrap}/>
      {children}
    </MigrationBaseProvider>
  );
};

export const MigrationBaseProvider: React.FC = ({ children }) => {
  const [isFinished, setIsFinished] = React.useState<boolean>(false);

  const execute = (db: DB, migrationList: Migration[], options?: Options) => {
    const tableName = options?.tableName || DEFAULT_TABLE_NAME;
    const columnName = options?.columnName || DEFAULT_COLUMN_NAME;

    db.exec(
      [
        {
          sql: `CREATE TABLE IF NOT EXISTS ${tableName} (${columnName} TEXT);`,
          args: [],
        },
      ],
      false,
      (err, results) => {
        if (err) {
          console.error(err);
          throw err;
        }

        const result = results[0];

        if (isResultSetError(result)) {
          console.error(result.error);
          throw result.error;
        }

        db.exec(
          [{ sql: `SELECT * FROM ${tableName};`, args: [] }],
          false,
          (err, results) => {
            if (err) {
              console.error(err);
              throw err;
            }
            const result = results[0];
            if (isResultSetError(result)) {
              console.error(result.error);
              throw result.error;
            }
            const { rows } = result;
            const alreadyMigrated: string[] =
              rows.map((m) => m[columnName]) || [];

            const _migrationList = migrationList.filter(
              (m) => !alreadyMigrated.includes(m.name)
            );
            migrate({ db, tableName, columnName }, _migrationList);
          }
        );
      }
    );
  };

  const migrate = (
    {
      db,
      tableName,
      columnName,
    }: { db: DB; tableName: string; columnName: string },
    list: Migration[]
  ) => {
    const [migrationParams, ...rest] = list;
    if (migrationParams == null) {
      setIsFinished(true);
      return;
    }

    // migration
    db.exec([{ sql: `${migrationParams.query}`, args: [] }], false, () => {
      // insert migration history
      db.exec(
        [
          {
            sql: `INSERT INTO ${tableName} (${columnName}) VALUES ('${migrationParams.name}');`,
            args: [],
          },
        ],
        false,
        (err, results) => {
          if (err) {
            console.error(err);
            throw err;
          }
          const result = results[0];
          if (isResultSetError(result)) {
            console.error(result.error);
            throw result.error;
          }
          migrate({ db, tableName, columnName }, rest);
        }
      );
    });
  };

  const value = { isFinished, execute };

  return (
    <MigrationContext.Provider value={value}>
      {children}
    </MigrationContext.Provider>
  );
};

const isResultSetError = (r: any): r is SQLite.ResultSetError => !!r.error;
