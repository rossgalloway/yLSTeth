import BOOTSTRAP_ABI from 'app/utils/abi/bootstrap.abi';
import {MULTICALL_ABI} from 'app/utils/abi/multicall3.abi';
import assert from 'assert';
import {CID} from 'multiformats';
import {toString as uint8ArrayToString} from 'uint8arrays/to-string';
import {type Hex, zeroAddress} from 'viem';
import {assertAddress, ETH_TOKEN_ADDRESS, toAddress, WETH_TOKEN_ADDRESS} from '@builtbymom/web3/utils';
import {handleTx} from '@builtbymom/web3/utils/wagmi';

import {STYETH_TOKEN, YETH_TOKEN} from './tokens';
import {BASKET_ABI} from './utils/abi/basket.abi';
import {CURVE_SWAP_ABI} from './utils/abi/curveswap.abi';
import {GOVERNOR_ABI} from './utils/abi/governor.abi';
import {INCLUSION_ABI} from './utils/abi/inclusion.abi';
import {INCLUSION_INCENTIVE_ABI} from './utils/abi/inclusionIncentives.abi';
import {ONCHAIN_VOTE_INCLUSION_ABI} from './utils/abi/onchainVoteInclusion.abi';
import {ONCHAIN_VOTE_WEIGHT_ABI} from './utils/abi/onchainVoteWeight.abi';
import {ST_YETH_ABI} from './utils/abi/styETH.abi';
import {WEIGHT_INCENTIVE_ABI} from './utils/abi/weightIncentives.abi';
import {ZAP_ABI} from './utils/abi/zap.abi';

import type {TAddress} from '@builtbymom/web3/types';
import type {TTxResponse, TWriteTransaction} from '@builtbymom/web3/utils/wagmi';

/* 🔵 - Yearn Finance **********************************************************
 ** multicall is a _WRITE_ function that can be used to cast a multicall
 **
 ** @app - common
 ** @param protocols - an array of protocols to vote for.
 ** @param amounts - an array of amounts to vote for each protocol.
 ******************************************************************************/
type TMulticall = TWriteTransaction & {
	multicallData: {target: TAddress; callData: Hex}[];
};
export async function multicall(props: TMulticall): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.multicallData.length > 0, 'Nothing to do');
	const multicallAddress = toAddress('0xcA11bde05977b3631167028862bE2a173976CA11');

	return await handleTx(props, {
		address: multicallAddress,
		abi: MULTICALL_ABI,
		functionName: 'tryAggregate',
		confirmation: 1,
		args: [true, props.multicallData],
		value: 0n
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** multicall is a _WRITE_ function that can be used to cast a multicall
 **
 ** @app - common
 ** @param multicallData - an array of multicalls
 ******************************************************************************/
type TMulticallValue = TWriteTransaction & {
	multicallData: {
		target: TAddress;
		callData: Hex;
		value: bigint;
		allowFailure: boolean;
	}[];
};
export async function multicallValue(props: TMulticallValue): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.multicallData.length > 0, 'Nothing to do');
	assertAddress(props.contractAddress, 'ContractAddress');

	const value = props.multicallData.reduce((a, b): bigint => a + b.value, 0n);
	return await handleTx(props, {
		address: props.contractAddress,
		abi: MULTICALL_ABI,
		functionName: 'aggregate3Value',
		confirmation: 1,
		args: [props.multicallData],
		value: value
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** addLiquidityToPool is a _WRITE_ function that deposits some of the LP tokens
 ** into the pool in exchange for yETH.
 **
 ** @app - yETH
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TAddLiquidityToPool = TWriteTransaction & {
	amounts: bigint[];
	estimateOut: bigint;
};
export async function addLiquidityToPool(props: TAddLiquidityToPool): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.estimateOut > 0n, 'EstimateOut is 0');
	assert(
		props.amounts.some((amount): boolean => amount > 0n),
		'Amount is 0'
	);
	assertAddress(process.env.POOL_ADDRESS, 'POOL_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.POOL_ADDRESS),
		abi: BASKET_ABI,
		functionName: 'add_liquidity',
		confirmation: 1,
		args: [props.amounts, props.estimateOut]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** removeLiquidityFromPool is a _WRITE_ function that withdraw some of one
 ** LP tokens from the pool.
 **
 ** @app - yETH
 ** @param index - The index of the LP token to get.
 ** @param amount - The amount of yETH to remove.
 ** @param minOut - The minimum amount of LP to receive.
 ******************************************************************************/
type TRemoveLiquidityFromPool = TWriteTransaction & {
	amount: bigint;
	minOuts: bigint[];
};
export async function removeLiquidityFromPool(props: TRemoveLiquidityFromPool): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assert(
		props.minOuts.some((minOut): boolean => minOut > 0n),
		'MinOut is 0'
	);
	assertAddress(process.env.POOL_ADDRESS, 'POOL_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.POOL_ADDRESS),
		abi: BASKET_ABI,
		functionName: 'remove_liquidity',
		confirmation: 1,
		args: [props.amount, props.minOuts]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** removeLiquiditySingleFromPool is a _WRITE_ function that withdraw some of one
 ** LP tokens from the pool.
 **
 ** @app - yETH
 ** @param index - The index of the LP token to get.
 ** @param amount - The amount of yETH to remove.
 ** @param minOut - The minimum amount of LP to receive.
 ******************************************************************************/
type TRemoveLiquiditySingleFromPool = TWriteTransaction & {
	index: bigint;
	amount: bigint;
	minOut: bigint;
};
export async function removeLiquiditySingleFromPool(props: TRemoveLiquiditySingleFromPool): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.minOut > 0n, 'minOut is 0');
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.index >= 0n, 'Index is negative');
	assert(props.index <= 7n, 'Index is too large');
	assertAddress(process.env.POOL_ADDRESS, 'POOL_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.POOL_ADDRESS),
		abi: BASKET_ABI,
		functionName: 'remove_liquidity_single',
		confirmation: 1,
		args: [props.index, props.amount, props.minOut]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** stakeYETH is a _WRITE_ function that deposits yETH into the st-yETH contract
 ** in exchange for shares of st-yETH.
 **
 ** @app - yETH
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TStakeYETH = TWriteTransaction & {
	amount: bigint;
};
export async function stakeYETH(props: TStakeYETH): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(process.env.STYETH_ADDRESS, 'STYETH_ADDRESS');

	return await handleTx(props, {
		address: STYETH_TOKEN.address,
		abi: ST_YETH_ABI,
		functionName: 'deposit',
		confirmation: 1,
		args: [props.amount]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** unstakeYETH is a _WRITE_ function that deposits yETH into the st-yETH contract
 ** in exchange for shares of st-yETH.
 **
 ** @app - yETH
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TUnstakeYETH = TWriteTransaction & {
	amount: bigint;
};
export async function unstakeYETH(props: TUnstakeYETH): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(STYETH_TOKEN.address, 'STYETH_TOKEN');

	return await handleTx(props, {
		address: STYETH_TOKEN.address,
		abi: ST_YETH_ABI,
		functionName: 'redeem',
		confirmation: 1,
		args: [props.amount]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** swapLST is a _WRITE_ function that swaps one of the LST tokens for another.
 **
 ** @app - yETH
 ** @param lstTokenFromIndex - The index of the LST token to swap from
 ** @param lstTokenToIndex - The index of the LST token to swap to
 ** @param amount - The amount of LST tokens from to swap
 ** @param minAmountOut - The minimum amount of LST tokens to receive
 ******************************************************************************/
type TSwapLST = TWriteTransaction & {
	lstTokenFromIndex: bigint;
	lstTokenToIndex: bigint;
	amount: bigint;
	minAmountOut: bigint;
};
export async function swapLST(props: TSwapLST): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.minAmountOut > 0n, 'minAmountOut is 0');
	assert(props.lstTokenFromIndex >= 0n, 'lstTokenFromIndex is 0');
	assert(props.lstTokenToIndex >= 0n, 'lstTokenToIndex is 0');
	assert(props.lstTokenFromIndex <= 4n, 'lstTokenFromIndex is too high');
	assert(props.lstTokenToIndex <= 4n, 'lstTokenToIndex is too high');
	assert(props.lstTokenFromIndex !== props.lstTokenToIndex, 'lstTokenFromIndex and lstTokenToIndex are the same');
	assertAddress(process.env.POOL_ADDRESS, 'POOL_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.POOL_ADDRESS),
		abi: BASKET_ABI,
		functionName: 'swap',
		confirmation: 1,
		args: [props.lstTokenFromIndex, props.lstTokenToIndex, props.amount, props.minAmountOut]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** swapOutLST is a _WRITE_ function that swaps one of the LST tokens for another.
 ** The main difference between this and swapLST is that this function will
 ** get the exact amount to receive.
 **
 ** @app - yETH
 ** @param lstTokenFromIndex - The index of the LST token to swap from
 ** @param lstTokenToIndex - The index of the LST token to swap to
 ** @param amount - The amount of LST tokens to to receive
 ** @param maxAmountIn - The maximum amount of LST tokens to send
 ******************************************************************************/
type TSwapOutLST = TWriteTransaction & {
	lstTokenFromIndex: bigint;
	lstTokenToIndex: bigint;
	amount: bigint;
	maxAmountIn: bigint;
};
export async function swapOutLST(props: TSwapOutLST): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.maxAmountIn > 0n, 'maxAmountIn is 0');
	assert(props.lstTokenFromIndex >= 0n, 'lstTokenFromIndex is 0');
	assert(props.lstTokenToIndex >= 0n, 'lstTokenToIndex is 0');
	assert(props.lstTokenFromIndex <= 4n, 'lstTokenFromIndex is too high');
	assert(props.lstTokenToIndex <= 4n, 'lstTokenToIndex is too high');
	assert(props.lstTokenFromIndex !== props.lstTokenToIndex, 'lstTokenFromIndex and lstTokenToIndex are the same');
	assertAddress(process.env.POOL_ADDRESS, 'POOL_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.POOL_ADDRESS),
		abi: BASKET_ABI,
		functionName: 'swap_exact_out',
		confirmation: 1,
		args: [props.lstTokenFromIndex, props.lstTokenToIndex, props.amount, props.maxAmountIn]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** depositAndStake is a _WRITE_ function that deposits some of the LP tokens
 ** into the pool in exchange for st-yETH.
 **
 ** @app - yETH
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TDepositAndStake = TWriteTransaction & {
	amounts: bigint[];
	estimateOut: bigint;
};
export async function depositAndStake(props: TDepositAndStake): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.estimateOut > 0n, 'EstimateOut is 0');
	assert(
		props.amounts.some((amount): boolean => amount > 0n),
		'Amount is 0'
	);
	assertAddress(process.env.ZAP_ADDRESS, 'ZAP_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.ZAP_ADDRESS),
		abi: ZAP_ABI,
		functionName: 'add_liquidity',
		confirmation: 1,
		args: [props.amounts, props.estimateOut]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** depositXIncentive is a _WRITE_ function that deposits incentives for a given
 ** choice of vote.
 **
 ** @app - yETH
 ** @param choice - index of the choice, 0 always being no change
 ** @param tokenAsIncentive - address of the token to incentivize
 ** @param amount - The amount of incentives to deposit.
 ******************************************************************************/
type TDepositInclusionIncentive = TWriteTransaction & {
	choice: TAddress;
	tokenAsIncentive: TAddress;
	amount: bigint;
};
export async function depositInclusionIncentive(props: TDepositInclusionIncentive): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.tokenAsIncentive, 'tokenAsIncentive');
	assertAddress(process.env.INCLUSION_INCENTIVES_ADDRESS, 'INCLUSION_INCENTIVES_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.INCLUSION_INCENTIVES_ADDRESS),
		abi: INCLUSION_INCENTIVE_ABI,
		functionName: 'deposit',
		confirmation: 1,
		args: [props.choice, props.tokenAsIncentive, props.amount]
	});
}

type TDepositWeightIncentive = TWriteTransaction & {
	choice: bigint;
	tokenAsIncentive: TAddress;
	amount: bigint;
};
export async function depositWeightIncentive(props: TDepositWeightIncentive): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.choice >= 0n, 'choice is negative');
	assertAddress(props.tokenAsIncentive, 'tokenAsIncentive');
	assertAddress(process.env.WEIGHT_INCENTIVES_ADDRESS, 'WEIGHT_INCENTIVES_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS),
		abi: WEIGHT_INCENTIVE_ABI,
		functionName: 'deposit',
		confirmation: 1,
		args: [props.choice, props.tokenAsIncentive, props.amount]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** depositAndStake is a _WRITE_ function that deposits some of the LP tokens
 ** into the pool in exchange for st-yETH.
 **
 ** @app - yETH
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TCurveExchangeMultiple = TWriteTransaction & {
	amount: bigint;
	estimateOut: bigint;
};
export async function curveExchangeMultiple(props: TCurveExchangeMultiple): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.estimateOut > 0n, 'EstimateOut is 0');
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress);

	return await handleTx(props, {
		address: toAddress(props.contractAddress),
		abi: CURVE_SWAP_ABI,
		functionName: 'exchange_multiple',
		confirmation: 1,
		value: props.amount,
		args: [
			[
				ETH_TOKEN_ADDRESS,
				WETH_TOKEN_ADDRESS,
				WETH_TOKEN_ADDRESS,
				toAddress(process.env.CURVE_YETH_POOL_ADDRESS),
				YETH_TOKEN.address,
				toAddress(zeroAddress),
				toAddress(zeroAddress),
				toAddress(zeroAddress),
				toAddress(zeroAddress)
			],
			[
				[0n, 0n, 15n],
				[0n, 1n, 1n],
				[0n, 0n, 0n],
				[0n, 0n, 0n]
			],
			props.amount,
			(props.amount * 995n) / 1000n
		]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** unlock is a _WRITE_ function that unlocks the styETH from the bootstrap
 ** contract.
 **
 ** @app - yETH
 ******************************************************************************/
type TUnlockFromBootstrap = TWriteTransaction & {
	amount: bigint;
};
export async function unlockFromBootstrap(props: TUnlockFromBootstrap): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.amount > 0n);
	assertAddress(process.env.BOOTSTRAP_ADDRESS, 'BOOTSTRAP_ADDRESS');

	return await handleTx(props, {
		address: toAddress(process.env.BOOTSTRAP_ADDRESS),
		abi: BOOTSTRAP_ABI,
		functionName: 'claim',
		confirmation: 1,
		args: [props.amount]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** propose is a _WRITE_ function that creates a proposal on the onchain gov
 ** contract.
 **
 ** @app - yETH
 ******************************************************************************/
type TPropose = TWriteTransaction & {
	ipfs: string;
	script: Hex;
};
export async function propose(props: TPropose): Promise<TTxResponse> {
	assert(props.connector, 'No connector');

	const cidv0 = CID.parse(props.ipfs);
	const cidV1 = cidv0.toV1();
	const multihashDigestInHex = uint8ArrayToString(cidV1.multihash.digest, 'base16').toUpperCase();
	console.warn([`0x${multihashDigestInHex}`, props.script]);

	return await handleTx(props, {
		address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
		abi: GOVERNOR_ABI,
		functionName: 'propose',
		confirmation: 1,
		args: [`0x${multihashDigestInHex}`, props.script]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** retract is a _WRITE_ function that retract a proposal on the onchain gov
 ** contract.
 **
 ** @app - yETH
 ******************************************************************************/
type TRetract = TWriteTransaction & {
	index: bigint;
};
export async function retract(props: TRetract): Promise<TTxResponse> {
	assert(props.connector, 'No connector');

	return await handleTx(props, {
		address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
		abi: GOVERNOR_ABI,
		functionName: 'retract',
		confirmation: 1,
		args: [props.index]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** voteYea, voteNay and voteAbstain are _WRITE_ functions that cast a vote on
 ** a proposal.
 **
 ** @app - yETH
 ******************************************************************************/
type TVoteForProposal = TWriteTransaction & {
	index: bigint;
};
export async function voteYea(props: TVoteForProposal): Promise<TTxResponse> {
	assert(props.connector, 'No connector');

	return await handleTx(props, {
		address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
		abi: GOVERNOR_ABI,
		functionName: 'vote_yea',
		confirmation: 1,
		args: [props.index]
	});
}

export async function voteNay(props: TVoteForProposal): Promise<TTxResponse> {
	assert(props.connector, 'No connector');

	return await handleTx(props, {
		address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
		abi: GOVERNOR_ABI,
		functionName: 'vote_nay',
		confirmation: 1,
		args: [props.index]
	});
}

export async function voteAbstain(props: TVoteForProposal): Promise<TTxResponse> {
	assert(props.connector, 'No connector');

	return await handleTx(props, {
		address: toAddress(process.env.ONCHAIN_GOV_ADDRESS),
		abi: GOVERNOR_ABI,
		functionName: 'vote_abstain',
		confirmation: 1,
		args: [props.index]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** voteWeights is a _WRITE_ function that cast a vote for the weights of the
 ** LST tokens.
 **
 ** @app - yETH
 ******************************************************************************/
type TVoteForWeight = TWriteTransaction & {
	weight: bigint[];
};
export async function voteWeights(props: TVoteForWeight): Promise<TTxResponse> {
	assert(props.connector, 'No connector');

	return await handleTx(props, {
		address: toAddress(process.env.WEIGHT_VOTE_ADDRESS),
		abi: ONCHAIN_VOTE_WEIGHT_ABI,
		functionName: 'vote',
		confirmation: 1,
		args: [props.weight]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** voteInclusion is a _WRITE_ function that cast a vote for the inclusion of new
 ** LST tokens.
 **
 ** @app - yETH
 ******************************************************************************/
type TVoteForInclusion = TWriteTransaction & {
	weight: bigint[];
};
export async function voteInclusion(props: TVoteForInclusion): Promise<TTxResponse> {
	assert(props.connector, 'No connector');

	return await handleTx(props, {
		address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
		abi: ONCHAIN_VOTE_INCLUSION_ABI,
		functionName: 'vote',
		confirmation: 1,
		args: [props.weight]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** apply is a _WRITE_ function that apply for a new LST address to be included
 ** in the yETH basket.
 **
 ** @app - yETH
 ******************************************************************************/
type TApply = TWriteTransaction & {
	lstAddress: TAddress;
};
export async function apply(props: TApply): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assertAddress(props.lstAddress, 'lstAddress');

	return await handleTx(props, {
		address: toAddress(process.env.INCLUSION_VOTE_ADDRESS),
		abi: INCLUSION_ABI,
		functionName: 'apply',
		confirmation: 1,
		args: [toAddress(props.lstAddress)]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** claimManyWeightIncentive is a _WRITE_ function that claims the incentives for
 ** many tokens.
 **
 ** @app - yETH
 ******************************************************************************/
type TClaimManyWeightIncentive = TWriteTransaction & {
	epochs: bigint[];
	idxs: bigint[];
	tokens: TAddress[];
};
export async function claimManyWeightIncentive(props: TClaimManyWeightIncentive): Promise<TTxResponse> {
	assert(props.connector, 'No connector');

	return await handleTx(props, {
		address: toAddress(process.env.WEIGHT_INCENTIVES_ADDRESS),
		abi: WEIGHT_INCENTIVE_ABI,
		functionName: 'claim_many',
		confirmation: 1,
		args: [props.epochs, props.idxs, props.tokens]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** claimManyInclusionIncentive is a _WRITE_ function that claims the incentives
 ** for many inclusion tokens.
 **
 ** @app - yETH
 ******************************************************************************/
type TClaimManyInclusionIncentive = TWriteTransaction & {
	epochs: bigint[];
	tokens: TAddress[];
};
export async function claimManyInclusionIncentive(props: TClaimManyInclusionIncentive): Promise<TTxResponse> {
	assert(props.connector, 'No connector');

	return await handleTx(props, {
		address: toAddress(process.env.INCLUSION_INCENTIVES_ADDRESS),
		abi: INCLUSION_INCENTIVE_ABI,
		functionName: 'claim_many',
		confirmation: 1,
		args: [props.epochs, props.tokens]
	});
}
