#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');
const clear = require('clear');
const _ = require('lodash');
const growlPkg = require('growl');
const axios = require('axios');
const cheerio = require('cheerio');
const ora = require('ora');

const config = {
  beepCount: 5,
  beepSound: '/System/Library/Sounds/Glass.aiff',
  delay: 30,
};

/**
 * Utils
 */

const beep = () => execSync(`afplay ${config.beepSound}`);

const growl = message => growlPkg(message, { title: 'Boost Scraper' });

/**
 * Main
 */

const target = [
  'https://www.size.co.uk/search/eqt+93+17/sale/size/9/',
  'https://www.size.co.uk/search/iniki/size/7/sale/',
  'https://www.size.co.uk/search/nmd+city+sock/colour/green/sale/size/5/',
];

let products = {};
let spinner;
let firstRun = true;
let spinnerRunning = false;

clear();

const run = () => {
  const promises = target.map(url =>
    axios({
      url,
      validateStatus: status =>
        (status >= 200 && status < 300) ||
        (status >= 400 && status < 500),
    }));

  axios.all(promises)
    .then(response => response.filter(res => res.status === 200))
    .then((responseArr) => {
      const newProducts = {};

      responseArr.forEach((response) => {
        const $ = cheerio.load(response.data);
        const urlProducts = [];

        $('#productListMain [data-productsku]').each((k, v) => {
          const sku = $(v).attr('data-productsku');

          urlProducts.push(sku);
        });

        newProducts[response.config.url] = urlProducts;
      });

      if (!_.isEqual(products, newProducts)) {
        if (!firstRun) {
          spinner.succeed();
          spinnerRunning = false;

          beep();
          growl('New products found');
        }

        console.log(chalk.green.bold('New products found:'));
        console.log(newProducts);
        console.log();
        console.log(chalk.red.bold('Diffs:'));
        _.forOwn(newProducts, (value, key) => {
          console.log(key, _.difference(products[key], value));
        });
        console.log();

        products = newProducts;
      }

      if (!spinnerRunning) {
        spinner = ora('Waiting...').start();
        spinnerRunning = true;
      }

      firstRun = false;
      setTimeout(run, config.delay * 100);
    })
    .catch(() => run);
};

run();
