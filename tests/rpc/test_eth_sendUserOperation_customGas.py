"""
Test suite for `eip4337 bunlder` module.
See https://github.com/eth-infinitism/bundler
"""

import pytest
from jsonschema import validate, Validator
from tests.types import RPCErrorCode
from tests.utils import userop_hash, assert_rpc_error, send_bundle_now

@pytest.mark.parametrize("schema_method", ["eth_sendUserOperation"], ids=[""])
def test_eth_sendUserOperation_needValidation_sendLater(wallet_contract, helper_contract, userop_customGas, schema):
    userop_customGas.sendImmediately = False
    userop_customGas.needSimulateValidation = True
    
    state_before = wallet_contract.functions.state().call()
    assert state_before == 0
    response = userop_customGas.send()
    send_bundle_now()
    state_after = wallet_contract.functions.state().call()
    assert response.result == userop_hash(helper_contract, userop_customGas)
    assert state_after == 1111111
    Validator.check_schema(schema)
    validate(instance=response.result, schema=schema)


@pytest.mark.parametrize("schema_method", ["eth_sendUserOperation"], ids=[""])
def test_eth_sendUserOperation_ignoreValidation_sendLater(wallet_contract, helper_contract, userop_customGas, schema):
    userop_customGas.sendImmediately = False
    userop_customGas.needSimulateValidation = False
    
    state_before = wallet_contract.functions.state().call()
    assert state_before == 0
    response = userop_customGas.send()
    send_bundle_now()
    state_after = wallet_contract.functions.state().call()
    assert response.result == userop_hash(helper_contract, userop_customGas)
    assert state_after == 1111111
    Validator.check_schema(schema)
    validate(instance=response.result, schema=schema)



@pytest.mark.parametrize("schema_method", ["eth_sendUserOperation"], ids=[""])
def test_eth_sendUserOperation_ignoreValidation_sendNow(wallet_contract, helper_contract, userop_customGas, schema):
    userop_customGas.sendImmediately = True
    userop_customGas.needSimulateValidation = False
    
    state_before = wallet_contract.functions.state().call()
    assert state_before == 0
    response = userop_customGas.send()
    # send_bundle_now()
    state_after = wallet_contract.functions.state().call()
    assert response.result == userop_hash(helper_contract, userop_customGas)
    assert state_after == 1111111
    Validator.check_schema(schema)
    validate(instance=response.result, schema=schema)




@pytest.mark.parametrize("schema_method", ["eth_sendUserOperation"], ids=[""])
def test_eth_sendUserOperation_needValidation_sendNow(wallet_contract, helper_contract, userop_customGas, schema):
    userop_customGas.sendImmediately = True
    userop_customGas.needSimulateValidation = True
    
    state_before = wallet_contract.functions.state().call()
    assert state_before == 0
    response = userop_customGas.send()
    # send_bundle_now()
    state_after = wallet_contract.functions.state().call()
    assert response.result == userop_hash(helper_contract, userop_customGas)
    assert state_after == 1111111
    Validator.check_schema(schema)
    validate(instance=response.result, schema=schema)
