import * as bcrypt from 'bcryptjs';
import * as fsExtra from 'fs-extra';
import {Logger} from 'loggerhythm';
import * as path from 'path';
import * as Sequelize from 'sequelize';

const logger: Logger = Logger.createLogger('sequelize_connection_manager:connection_factory');

export class SequelizeConnectionManager {

  private connections: {[hash: string]: Sequelize.Sequelize} = {};

  /**
   * Returns a sequelize connection for the given configuration.
   *
   * @async
   * @param  {Object} config          Contains the settings with which to establish a database connection.
   *                                  Required parameters are host, port, database, dialect, username and password.
   * @param  {String} config.host     The name of the host where the database is located
   * @param  {String} config.port     The port by which to connect to the host
   * @param  {String} config.dialect  The type of database to which to connect (postgres, sqlite, mysql, etc)
   * @param  {String} config.database The name of the database to connect to.
   * @param  {String} config.username The username with which to connect to the database.
   * @param  {String} config.password The password with which to connect to the database.
   * @return {Object}                 The connection for the passed configuration.
   */
  public async getConnection(config: Sequelize.Options): Promise<Sequelize.Sequelize> {

    let hash: string;

    const dbToUse: string = config.dialect === 'sqlite'
      ? config.storage
      : config.database;

    if (config.dialect === 'sqlite') {
      hash = this._getHash(config.storage, config.username, config.password);
    } else {
      hash = this._getHash(config.database, config.username, config.password);
    }

    const connectionExists: boolean = this.connections[hash] !== undefined;
    if (connectionExists) {
      logger.info(`Active connection to '${dbToUse}' found.`);

      return Promise.resolve(this.connections[hash]);
    }

    if (config.dialect === 'sqlite') {
      const isAbsolutePath: boolean = path.isAbsolute(config.storage);
      if (isAbsolutePath) {
        fsExtra.ensureFileSync(config.storage);
      }
    }

    const connection: Sequelize.Sequelize = new Sequelize(dbToUse, config.username, config.password, config);
    logger.info(`Connection to database '${dbToUse}' established.`);
    this.connections[hash] = connection;

    return Promise.resolve(connection);
  }

  /**
   *
   * Destroys a sequelize connection, based on the given config.
   *
   * @async
   * @param {Object} config Contains the settings that describe the Sequelize
   *                        connection to destroy.
   */
  public async destroyConnection(config: Sequelize.Options): Promise<void> {

    let hash: string;

    const dbToUse: string = config.dialect === 'sqlite'
      ? config.storage
      : config.database;

    if (config.dialect === 'sqlite') {
      hash = this._getHash(config.storage, config.username, config.password);
    } else {
      hash = this._getHash(config.database, config.username, config.password);
    }

    const connectionExists: boolean = this.connections[hash] !== undefined;
    if (!connectionExists) {
      logger.info(`Connection to '${dbToUse}' not found.`);

      return Promise.resolve();
    }

    logger.info(`Disposing connection to '${dbToUse}'...`);
    await (this.connections[hash] as Sequelize.Sequelize).close();
    delete this.connections[hash];
    logger.info(`Done.`);
  }

  /**
   * Generates a hash from config settings marking a unique connection.
   *
   * @param  {String} database The name of the database to connect to.
   * @param  {String} username The username with which to connect to the database.
   * @param  {String} password The password with which to connect to the database.
   * @return {String} The generated hash.
   */
  private _getHash(database: string, username: string, password: string): string {
    const saltRounds: number = 1;
    const properties: string = `${database}${username}${password}`;
    const hashedXml: string = bcrypt.hashSync(properties, saltRounds);

    return hashedXml;
  }
}
