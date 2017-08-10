#!/usr/bin/env node

'use strict';

const
  { execSync }  = require('child_process'),
  chalk         = require('chalk'),
  clear         = require('clear'),
  growlPkg      = require('growl'),
  axios         = require('axios'),
  cheerio       = require('cheerio'),
  ora           = require('ora')
;

const config = {
  beepCount: 5,
  beepSound: '/System/Library/Sounds/Glass.aiff',
  delay: 10,
  domains: {
    size: {
      sources: [
        {
          title: 'NMD US 8.5 chi',
          url: 'https://www.size.co.uk/mens/size/8/sale/?facet-size-collection=adidas-originals-nmd&AJAX=1'
        },
        {
          title: 'NMD US 9 chi',
          url: 'https://www.size.co.uk/mens/size/8-5/sale/?facet-size-collection=adidas-originals-nmd&AJAX=1'
        },
        {
          title: 'Boost US 9 chi',
          url: 'https://www.size.co.uk/search/boost/size/8-5/sale/?AJAX=1'
        },
        {
          title: 'Aiah wonder pink',
          url: 'https://www.size.co.uk/products/search/?sku=280981&AJAX=1'
        }
      ],
      skip: ['263434']
    },
    jdsports: {
      sources: [
        {
          title: 'NMD US 8.5 chi',
          url: 'https://www.jdsports.co.uk/men/size/8/sale/?q=nmd&AJAX=1'
        },
        {
          title: 'NMD US 9 chi',
          url: 'https://www.jdsports.co.uk/men/size/8-5/sale/?q=nmd&AJAX=1'
        },
        {
          title: 'Boost US 9 chi',
          url: 'https://www.jdsports.co.uk/search/boost/size/8-5/sale/?AJAX=1'
        },
        {
          title: 'Aiah wonder pink',
          url: 'https://www.jdsports.co.uk/products/search/?sku=280981&AJAX=1'
        }
      ],
      skip: ['240757', '244265', '262110', '262122']
    }
  }
};

// `https://i1.adis.ws/t/jpl/sz_product_list?plu=sz_${sku}_a&qlt=80&w=300&h=337&v=1`

/*
 * Utils
 */
const beep = () => execSync(`afplay ${config.beepSound}`);

const growl = (message) => growlPkg(message, {title: 'Boost Scraper'});

// const die = () => process.exit(0);

// const sleep = (seconds) =>
//   new Promise((resolve) =>
//     setTimeout(resolve, (seconds * 1000))
//   );

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

              $('#productListMain [data-productsku]').each((k, v) => {
                let sku = $(v).attr('data-productsku');

                if (
                  // wonder pink
                  (sku === '280981' && !$(v).hasClass('itemSale')) ||
                  config.domains[domain].skip.includes(sku)
                  ) {
                  return true;
                }

                if (!products[domain].includes(sku)) {
                  newProducts[domain].push(sku);
                }
              });
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
          console.info(chalk.green.bold(`${domain} 🔥  ${newProducts[domain].join()}`));
          beep();

          products[domain] = [...new Set(products[domain].concat(newProducts[domain]))];
          console.info(chalk.cyan(`https://www.${domain}.co.uk/products/search/?sku=${products[domain].join()}`));
        }
      });

      if(hasChanges) {
        spinner = ora('Waiting...').start();
      }

      setTimeout(run, config.delay * 100)
    });
}

run();
