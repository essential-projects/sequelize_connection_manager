import * as crypto from 'crypto';
import {Logger} from 'loggerhythm';
import * as Sequelize from 'sequelize';

const logger: Logger = Logger.createLogger('sequelize_connection_manager:binding_factory');

const connections: {[hash: string]: Sequelize.Sequelize} = {};

/**
* The factory for creating database connections via Sequelize.
*
* @class BindingFactory
*/
export class BindingFactory {

 /**
  * Checks if an active Connection with the specified config exists.
  *
  * @method connectionExistsByHash
  * @param  {String}  hash The hash-code of the connection to look for.
  * @return {Boolean}      True, if the connection exists, otherwise false.
  */
  public connectionExists(hash: string): boolean {
   return typeof connections[hash] !== 'undefined';
  }

 /**
  * Returns a sequelize connection for the current configuration.
  *
  * @method getConnection
  * @param  {String} database The name of the database to connect to
  * @param  {String} username The username with which to connect to the database
  * @param  {String} password The password with which to connect to the database
  * @param  {Object} config   A set of optional configs used for the connection (like dialect, supportBigNumbers, etc)
  * @return {Object}          The connection for the passed configuration.
  */
  public async getConnection(database: string, username: string, password: string, config: Sequelize.Options): Promise<Sequelize.Sequelize> {

      const hash: string = this._getHash(database, username, password);

      const connectionExists: boolean = this.connectionExists(hash);

      if (connectionExists) {
        logger.verbose(`Active postgres connection to '${database}' found.`);

        return Promise.resolve(connections[hash]);
      }
      const connection: Sequelize.Sequelize = new Sequelize(database, username, password, config);
      logger.verbose(`postgres connection to database '${database}' established.`);
      connections[hash] = connection;

      return Promise.resolve(connection);
  }

 /**
  * Generates a hash from config settings marking a unique connection.
  *
  * @method _getHash
  * @private
  * @param  {String} database The name of the database to connect to
  * @param  {String} username The username with which to connect to the database
  * @param  {String} password The password with which to connect to the database
  * @return {String} The generated hash.
  */
  private _getHash(database: string, username: string, password: string): string {
    const hash: crypto.Hash = crypto.createHash('sha256');
    const properties: Array<string> = [database, username, password];

    return hash.update(properties.join('')).digest('hex');
  }
}
