/* eslint-disable @typescript-eslint/consistent-type-assertions */

import React, {createContext, useContext, useMemo, useState} from 'react';
import {erc20Abi} from 'viem';
import {useContractReads, useReadContract} from 'wagmi';
import {toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {BASKET_ABI} from '@libAbi/basket.abi';
import useTVL from '@yUSD/hooks/useTVL';

import type {TNormalizedBN} from '@builtbymom/web3/types';

type TUseLSTProps = {
	slippage: bigint;
	set_slippage: (value: bigint) => void;
	dailyVolume: number;
	TVL: number;
	TAL: TNormalizedBN;
	isTVLLoaded: boolean;
	totalDepositedETH: TNormalizedBN;
	stats: {
		amplification: bigint;
		rampStopTime: bigint;
		targetAmplification: bigint;
		swapFeeRate: bigint;
	};
};
const defaultProps: TUseLSTProps = {
	slippage: 50n,
	set_slippage: (): void => {},
	dailyVolume: 0,
	TVL: 0,
	TAL: zeroNormalizedBN,
	isTVLLoaded: false,
	totalDepositedETH: zeroNormalizedBN,
	stats: {
		amplification: toBigInt(0),
		rampStopTime: toBigInt(0),
		targetAmplification: toBigInt(0),
		swapFeeRate: toBigInt(0)
	}
};

const LSTContext = createContext<TUseLSTProps>(defaultProps);
export const LSTContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const [slippage, set_slippage] = useState(10n);
	const TVLData = useTVL();

	/* 🔵 - Yearn Finance **************************************************************************
	 ** useContractRead calling the `deposited` method from the bootstrap contract to get the total
	 ** deposited ETH from the contract.
	 **
	 ** @returns: bigint - total deposited eth
	 **********************************************************************************************/
	const {data: totalDepositedETH} = useReadContract({
		address: toAddress(process.env.YUSD_ADDRESS),
		abi: erc20Abi,
		chainId: Number(process.env.DEFAULT_CHAIN_ID),
		functionName: 'totalSupply',
		query: {
			select(data) {
				return toNormalizedBN(data, 18);
			}
		}
	});

	const {data: stats, isFetched: areStatsFetched} = useContractReads({
		contracts: [
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: BASKET_ABI,
				functionName: 'amplification',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			},
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: BASKET_ABI,
				functionName: 'ramp_stop_time',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			},
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: BASKET_ABI,
				functionName: 'target_amplification',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			},
			{
				address: toAddress(process.env.POOL_ADDRESS),
				abi: BASKET_ABI,
				functionName: 'swap_fee_rate',
				chainId: Number(process.env.DEFAULT_CHAIN_ID)
			}
		]
	});

	const contextValue = useMemo(
		(): TUseLSTProps => ({
			slippage,
			set_slippage,
			dailyVolume: 0,
			TVL: TVLData.TVL,
			TAL: TVLData.TAL,
			isTVLLoaded: TVLData.isLoaded,
			totalDepositedETH: totalDepositedETH || zeroNormalizedBN,
			stats: areStatsFetched
				? {
						amplification: toBigInt(stats?.[0]?.result as bigint),
						rampStopTime: toBigInt(stats?.[1]?.result as bigint),
						targetAmplification: toBigInt(stats?.[2]?.result as bigint),
						swapFeeRate: toBigInt(stats?.[3]?.result as bigint)
					}
				: defaultProps.stats
		}),
		[slippage, TVLData.TAL, TVLData.TVL, TVLData.isLoaded, areStatsFetched, stats, totalDepositedETH]
	);

	return <LSTContext.Provider value={contextValue}>{children}</LSTContext.Provider>;
};

const useLST = (): TUseLSTProps => useContext(LSTContext);
export default useLST;
