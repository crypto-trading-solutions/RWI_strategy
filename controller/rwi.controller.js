const to = require('await-to-js').default;
const Binance = require("../serializers/BinanceRequestProvider");
const validateData = require("../serializers/TradingViewAlert");
const binance = new Binance(process.env.APIKEY, process.env.APISECRET);
const roundDown = require('../utils/roundDown');
const checkOpenOrders = require('../utils/checkOpenOrders');
const tradingConfig = require('../tradingConfig');
const managePositions = require('../utils/managePositions');
const toPrecision = require('../utils/precision');

const makeDealHelperClass = require('../utils/makeDealHelper');
const accounts = require('../accounts/accounts');

class RwiController {
    async makeDeal(req, res, next) {
        if (!req.headers.host.includes('localhost')) return res.status(400).send({ error: 'Bad host' });

        console.log('req.body');
        console.log(req.body);
        console.log('req.body');

        const adapterData = new validateData(req.body.Ticker, req.body.Price, req.body.Time, req.body.Strategy, req.body.Action);

        let deposit = process.env.ORDER_SIZE;

        let makeDealHelper = new makeDealHelperClass(adapterData, deposit);

        // Array for saving logs for all accounts
        const dealsResult = [];
        const dealPromises = [];

        for (let i = 0; i < accounts.length; i++) {
            let makeDealHelper = new makeDealHelperClass(adapterData, deposit);
            dealPromises.push(new Promise(async (resolve, reject) => {
                /**
                            * Build object
                            * Set future leverage 
                            * Set future margin type
                            * Get exchange info
                            * Get symbol precisions
                            */
                await makeDealHelper.build(accounts[i]);

                // Check open orders. If open orders exist return ERROR, if no open orders return FALSE
                const manageDealResult = await makeDealHelper.checkOpenOrders();

                console.log('accounts');
                console.log(accounts[i]);
                console.log('accounts');

                if (manageDealResult.Error) {
                    await dealsResult.push({ user: { id: accounts[i].id, name: accounts[i].name }, manageDealResult });
                    return;
                }

                // This function check given action and open appropriate deal
                // Action       |  OpenedDeal
                // LONG         |  BUY
                // CLOSE_LONG   |  SELL
                // SHORT        |  SELL
                // CLOSE_SHORT  |  BUY
                resolve(makeDealHelper.manageDeals());
            }));

        }

        Promise.all(dealPromises).then(res => {
            console.log('res');
            console.log(res);
            console.log('res');
        })

        return res.status(200).send({ end: 'end' });
    }
}


module.exports = new RwiController();