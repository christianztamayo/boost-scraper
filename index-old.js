#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');
const clear = require('clear');
const _ = require('lodash');
const growlPkg = require('growl');
const axios = require('axios');
const cheerio = require('cheerio');
const ora = require('ora');

/**
 * Utils
 */

const beep = () => execSync(`afplay ${config.beepSound}`);

const growl = (message) => growlPkg(message, {title: 'Boost Scraper'});

const config = {
  beepCount: 5,
  beepSound: '/System/Library/Sounds/Glass.aiff',
  delay: 30,
  domains: {
    size: {
      sources: [
        {
          title: 'EQT 93/17 US 9.5 chi/totie',
          url: 'https://www.size.co.uk/men/size/7-5,9/sale/?q=eqt+93+17&AJAX=1'
        },
        // {
        //   title: 'NMD US 8.5-9 chi',
        //   url: 'https://www.size.co.uk/mens/size/8,8-5/sale/?facet-size-collection=adidas-originals-nmd&AJAX=1'
        // },
        // {
        //   title: 'Boost US 9-9.5 chi',
        //   url: 'https://www.size.co.uk/search/boost/size/8-5,9/sale/?AJAX=1'
        // },
        {
          title: 'Iniki chi/aiah/tie',
          url: 'https://www.size.co.uk/search/iniki/size/5-5,7,8-5/sale/?AJAX=1'
        },
        // {
        //   title: 'Pure Boost LTD Black boost',
        //   url: 'https://www.size.co.uk/product/black-adidas-pure-boost-ltd/271252/?AJAX=1',
        //   isSingle: true,
        //   isSingleTarget: '8.5'
        // },
        // {
        //   title: 'NMD CS2 Teal aiah',
        //   url: 'https://www.size.co.uk/product/green-adidas-originals-nmd-city-sock-boost-womens/280990/?AJAX=1',
        //   isSingle: true,
        //   isSingleTarget: '5'
        // },
      ],
      skip: ['263434']
    },
    jdsports: {
      sources: [
        {
          title: 'EQT 93/17 US 9.5 chi/totie',
          url: 'https://www.jdsports.co.uk/men/size/7-5,9/sale/?q=eqt+93+17&AJAX=1'
        },
        // {
        //   title: 'NMD US 8.5-9 chi',
        //   url: 'https://www.jdsports.co.uk/men/size/8,8-5/sale/?q=nmd&AJAX=1'
        // },
        // {
        //   title: 'Boost US 9-9.5 chi',
        //   url: 'https://www.jdsports.co.uk/search/boost/size/8-5,9/sale/?AJAX=1'
        // },
        {
          title: 'Iniki chi/aiah/tie',
          url: 'https://www.jdsports.co.uk/search/iniki/size/5-5,7,8-5/sale/?AJAX=1'
        },
        // {
        //   title: 'UB Oreo US 9 chi',
        //   url: 'https://www.jdsports.co.uk/product/black-adidas-ultra-boost-uncaged/240274/?AJAX=1',
        //   isSingle: true,
        //   isSingleTarget: '8.5'
        // },
        // {
        //   title: 'UB v3 Black US 9 chi',
        //   url: 'https://www.jdsports.co.uk/product/black-adidas-ultra-boost-30/240267/?AJAX=1',
        //   isSingle: true,
        //   isSingleTarget: '8.5'
        // },
        // {
        //   title: 'UB v3 Red US 9 chi',
        //   url: 'https://www.jdsports.co.uk/product/red-adidas-ultra-boost-30/240268/?AJAX=1',
        //   isSingle: true,
        //   isSingleTarget: '8.5'
        // },
        // {
        //   title: 'UB v3 Green US 9 chi',
        //   url: 'https://www.jdsports.co.uk/product/green-adidas-ultra-boost-30/274768/?AJAX=1',
        //   isSingle: true,
        //   isSingleTarget: '8.5'
        // },
        // {
        //   title: 'UB v3 Grey US 9 chi',
        //   url: 'https://www.jdsports.co.uk/product/grey-adidas-ultra-boost-30/264282/?AJAX=1',
        //   isSingle: true,
        //   isSingleTarget: '8.5'
        // },
        // {
        //   title: 'UB v3 Blue US 9 chi',
        //   url: 'https://www.jdsports.co.uk/product/blue-adidas-ultra-boost-30/240270/?AJAX=1',
        //   isSingle: true,
        //   isSingleTarget: '8.5'
        // }
      ],
      skip: ['240757', '244265', '262110', '262122', '296221', '295775']
    }
  }
};

// `https://i1.adis.ws/t/jpl/sz_product_list?plu=sz_${sku}_a&qlt=80&w=300&h=337&v=1`

/*
 * Main
 */
clear();


let products = { size: [], jdsports: [] },
    newProducts = null,
    promises = null,
    spinner = null;

const run = () => {
  newProducts = { size: [], jdsports: [] };
  promises = [];

  Object.keys(config.domains).forEach((domain) => {
    config.domains[domain].sources
      .forEach((source) => {
        let promise = new Promise((resolve) => {
          axios.get(source.url)
            .then((response) => {
              let $ = cheerio.load(response.data);

              if (source.isSingle) {
                if ($('.itemPrices .was').length) {
                  $('#itemOptions .options .btn').each((k, v) => {
                    let btn = $(v);
                    if (btn.text().trim() == source.isSingleTarget && !btn.hasClass('noStock')) {
                      growl(`${source.title} in stock!!! RUSH!!!`);
                      console.info(chalk.green.bold(`${source.title} 🔥  ${source.url.replace('?AJAX=1', '')}`));
                      beep();
                    }
                  });
                }
              } else {
                $('#productListMain [data-productsku]').each((k, v) => {
                  const sku = $(v).attr('data-productsku');

                  if (!products[domain].includes(sku)) {
                    newProducts[domain].push(sku);
                  }
                });
              }
            })
            .then(() => resolve())
            .catch(() => resolve());
        });

        promises.push(promise)
      });
  });

  Promise.all(promises)
    .then(() => {
      let hasChanges = false;

      Object.keys(config.domains).forEach((domain) => {
        if (newProducts[domain].length) {
          hasChanges = true;

          if (spinner) {
            spinner.succeed();
          }

          growl(`New items on ${domain}`);
          console.info(chalk.green.bold(`${domain} 🔥  ${[...new Set(newProducts[domain])].join()}`));
          beep();

          products[domain] = [...new Set(products[domain].concat(newProducts[domain]))];
          console.info(chalk.cyan(`https://www.${domain}.co.uk/products/search/?sku=${products[domain].join()}`));
        }
      });

      if (hasChanges) {
        spinner = ora('Waiting...').start();
      }

      setTimeout(run, config.delay * 100)
    });
}

run();
