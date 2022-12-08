import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import _ from 'underscore';

function encodeParameters(types, values) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, Array.isArray(values) ? values : [values]);
}

function decodeParameters(types, data) {
  if (!data || data == '0x') {
    return null;
  }
  const abi = new ethers.utils.AbiCoder();
  return abi.decode(types, data);
}

function decodeResult(method_abi, result) {
  const method_output_params = method_abi.outputs;
  const decoded_result = decodeParameters(method_output_params, result);
  if (decoded_result && decoded_result.length == 1) {
    if (Array.isArray(decoded_result[0])) {
      return decoded_result[0].map((result) => result.toString());
    }
    return decoded_result[0].toString();
  } else {
    if (!decoded_result && method_output_params.length == 1) {
      return null;
    }
    const tuple = {};
    method_output_params.forEach((output, index) => {
      tuple[index] = decoded_result ? decoded_result[index].toString() : null;
      tuple[output.name] = decoded_result
        ? decoded_result[index].toString()
        : null;
    });
    return tuple;
  }
}

function convertBalancesToFixed(balances) {
  for (const token in balances) {
    try {
      balances[token] = balances[token].toFixed();
    } catch {}
  }
}

function convertBalancesToBigNumber(balances) {
  for (const token in balances) {
    balances[token] = new BigNumber(balances[token]);
  }
}

function sum(balanceArray) {
  const balances = {};

  _.each(balanceArray, (balanceEntries) => {
    _.each(balanceEntries, (balance, address) => {
      balances[address] = BigNumber(balances[address] || 0)
        .plus(balance)
        .toFixed();
    });
  });

  return balances;
}

function sumMultiBalanceOf(balances, results) {
  try {
    if (results.output) {
      _.each(results.output, (result) => {
        if (result.success) {
          const address = result.input.target;
          const balance = result.output;

          if (BigNumber(balance).toNumber() <= 0) {
            return;
          }

          balances[address] = BigNumber(balances[address] || 0)
            .plus(balance)
            .toFixed();
        }
      });
      convertBalancesToFixed(balances);
    } else {
      convertBalancesToBigNumber(balances);
      results.forEach((result) => {
        if (result && result.balance.isGreaterThan(0)) {
          const address = result.token.startsWith('0x')
            ? result.token.toLowerCase()
            : result.token;

          if (!balances[address]) {
            balances[address] = new BigNumber(0);
          }
          balances[address] = balances[address].plus(result.balance);
        }
      });
    }
  } catch (e) {
    return balances;
  }
}

export default {
  encodeParameters,
  decodeParameters,
  decodeResult,
  convertBalancesToFixed,
  convertBalancesToBigNumber,
  sum,
  sumMultiBalanceOf,
};
