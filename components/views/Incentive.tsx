import React, {useCallback, useMemo, useState} from 'react';
import assert from 'assert';
import ComboboxAddressInput from 'components/common/ComboboxAddressInput';
import {ImageWithFallback} from 'components/common/ImageWithFallback';
import IconChevronPlain from 'components/icons/IconChevronPlain';
import IconSpinner from 'components/icons/IconSpinner';
import useBootstrap from 'contexts/useBootstrap';
import {useTokenList} from 'contexts/useTokenList';
import {useWallet} from 'contexts/useWallet';
import {useTimer} from 'hooks/useTimer';
import {handleInputChangeEventValue} from 'utils';
import {approveERC20} from 'utils/actions';
import {ETH_TOKEN} from 'utils/tokens';
import {erc20ABI, useContractRead} from 'wagmi';
import {useDeepCompareEffect} from '@react-hookz/web';
import {Button} from '@yearn-finance/web-lib/components/Button';
import {Renderable} from '@yearn-finance/web-lib/components/Renderable';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useChainID} from '@yearn-finance/web-lib/hooks/useChainID';
import {IconChevronBottom} from '@yearn-finance/web-lib/icons/IconChevronBottom';
import {toAddress, truncateHex} from '@yearn-finance/web-lib/utils/address';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {toBigInt, toNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import {amountV2, formatAmount, formatPercent} from '@yearn-finance/web-lib/utils/format.number';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {assertAddress} from '@yearn-finance/web-lib/utils/wagmi/utils';
import {defaultTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

import type {TTokenInfo} from 'contexts/useTokenList';
import type {TGroupedIncentives, TIncentives, TIncentivesFor} from 'hooks/useBootstrapIncentives';
import type {ChangeEvent, ReactElement} from 'react';
import type {TAddress, TDict} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';
import type {TTxStatus} from '@yearn-finance/web-lib/utils/web3/transaction';

function isValidAddress(address: TAddress | undefined): boolean {
	if (!address) {
		return false;
	}
	try {
		assertAddress(address);
		return true;
	} catch (error) {
		return false;
	}
}

type TSortDirection = '' | 'desc' | 'asc'

function Timer(): ReactElement {
	const {periods} = useBootstrap();
	const {incentiveBegin, incentiveEnd, incentiveStatus} = periods || {};
	const time = useTimer({endTime: incentiveStatus === 'started' ? Number(incentiveEnd) : Number(incentiveBegin)});
	return <>{incentiveStatus === 'ended' ? 'ended' : incentiveStatus === 'started' ? time : `in ${time}`}</>;
}

function IncentiveMenuTabs({set_currentTab, currentTab}: {
	currentTab: 'current' | 'potential';
	set_currentTab: (tab: 'current' | 'potential') => void;
}): ReactElement {
	return (
		<div className={'relative -mx-4 overflow-hidden px-4 md:px-72'}>
			<button
				onClick={(): void => set_currentTab('current')}
				className={cl('mx-4 mb-2 text-lg transition-colors', currentTab === 'current' ? 'text-purple-300 font-bold' : 'text-neutral-400')}>
				{'Current participants'}
			</button>
			<button
				onClick={(): void => set_currentTab('potential')}
				className={cl('mx-4 mb-2 text-lg transition-colors', currentTab === 'potential' ? 'text-purple-300 font-bold' : 'text-neutral-400')}>
				{'Potential participants'}
			</button>
			<div className={'absolute bottom-0 left-0 flex h-0.5 w-full flex-row bg-neutral-300 px-4 md:px-72'}>
				<div className={cl('h-full w-fit transition-colors ml-4', currentTab === 'current' ? 'bg-purple-300' : 'bg-transparent')}>
					<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>{'Current participants'}</button>
				</div>
				<div className={cl('h-full w-fit transition-colors ml-4', currentTab === 'potential' ? 'bg-purple-300' : 'bg-transparent')}>
					<button className={'pointer-events-none invisible h-0 p-0 text-lg font-bold opacity-0'}>{'Potential participants'}</button>
				</div>
			</div>
		</div>
	);
}

function IncentiveGroupBreakdownItem({item}: {item: TIncentives}): ReactElement {
	return (
		<div
			aria-label={'content'}
			className={'grid w-full grid-cols-8 py-2 md:w-[52%]'}>
			<div className={'col-span-2 flex w-full flex-row items-center space-x-2'}>
				<div className={'h-6 w-6 min-w-[24px]'}>
					<ImageWithFallback
						key={item.incentiveToken?.logoURI || ''}
						src={item.incentiveToken?.logoURI || ''}
						alt={''}
						unoptimized
						width={24}
						height={24} />
				</div>
				<div>
					<p className={'text-xs'}>
						{item?.incentiveToken?.symbol || truncateHex(item.incentive, 6)}
					</p>
				</div>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p className={'font-number pr-1 text-xxs md:text-xs'}>
					{`${formatAmount(toNormalizedBN(item.amount, item.incentiveToken?.decimals)?.normalized || 0, 6, 6)}`}
				</p>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p className={'font-number pr-1 text-xxs md:text-xs'}>
					{`$${formatAmount(item.value, 2, 2)}`}
				</p>
			</div>
			<div className={'col-span-2 flex items-center justify-end'}>
				<p className={'font-number pr-1 text-xxs md:text-xs'}>
					{`${formatPercent(item.estimatedAPR, 2)}`}
				</p>
			</div>
		</div>
	);
}

function IncentiveGroupBreakdown({incentives}: {incentives: TIncentives[]}): ReactElement {
	const [sortBy, set_sortBy] = useState<string>('');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('');

	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to sort the vaults list.
	**	The use of useCallback() is to prevent the method from being re-created on every render.
	**********************************************************************************************/
	const onSort = useCallback((newSortBy: string, newSortDirection: string): void => {
		performBatchedUpdates((): void => {
			set_sortBy(newSortBy);
			set_sortDirection(newSortDirection as TSortDirection);
		});
	}, []);

	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to toggle the sort direction.
	**	By default, the sort direction is descending. If the user clicks on the same column again,
	**	the sort direction will be toggled to ascending. If the user clicks on a different column,
	**	the sort direction will be set to descending.
	**********************************************************************************************/
	const toggleSortDirection = (newSortBy: string): TSortDirection => {
		return sortBy === newSortBy ? (
			sortDirection === '' ? 'desc' : sortDirection === 'desc' ? 'asc' : 'desc'
		) : 'desc';
	};

	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to render the chevron icon.
	**	The chevron color and direction will change depending on the sort direction.
	**********************************************************************************************/
	const renderChevron = useCallback((shouldSortBy: boolean): ReactElement => {
		if (shouldSortBy && sortDirection === 'desc') {
			return <IconChevronPlain className={'yearn--sort-chevron transition-all'} />;
		}
		if (shouldSortBy && sortDirection === 'asc') {
			return <IconChevronPlain className={'yearn--sort-chevron rotate-180 transition-all'} />;
		}
		return <IconChevronPlain className={'yearn--sort-chevron--off text-neutral-300 transition-all group-hover:text-neutral-500'} />;
	}, [sortDirection]);

	return (
		<div className={'border-t border-neutral-300 bg-neutral-100 px-4 pb-2 pt-4'}>
			<div className={'mb-4'}>
				<b className={'text-xs'}>{'Incentives Breakdown'}</b>
			</div>
			<div aria-label={'header'} className={'mb-2 grid w-full grid-cols-8 md:w-[52%]'}>
				<div className={'col-span-2'}>
					<p className={'text-xs text-neutral-500'}>
						{'Token used'}
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('amount', toggleSortDirection('amount'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'Amount'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'amount')}
						</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('usdValue', toggleSortDirection('usdValue'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						<span className={'hidden md:block'}>{'USD Value'}</span>
						<span className={'block md:hidden'}>{'$ Value'}</span>
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'usdValue')}
						</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('apr', toggleSortDirection('apr'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'APR'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'apr')}
						</span>
					</p>
				</div>
			</div>
			{incentives
				.sort((a, b): number => {
					let aValue = 0;
					let bValue = 0;
					if (sortBy === 'amount') {
						aValue = Number(toNormalizedBN(a.amount, a.incentiveToken?.decimals)?.normalized);
						bValue = Number(toNormalizedBN(b.amount, b.incentiveToken?.decimals)?.normalized);
					} else if (sortBy === 'usdValue') {
						aValue = a.value;
						bValue = b.value;
					} else if (sortBy === 'apr') {
						aValue = a.estimatedAPR;
						bValue = b.estimatedAPR;
					}
					return sortDirection === 'desc' ? Number(bValue) - Number(aValue) : Number(aValue) - Number(bValue);
				})
				.map((item, index): ReactElement => (<IncentiveGroupBreakdownItem key={index} item={item} />))}
		</div>
	);
}

function IncentiveGroup({item}: {item: TGroupedIncentives}): ReactElement {
	const {safeChainID} = useChainID(Number(process.env.BASE_CHAIN_ID));

	return (
		<details
			aria-label={'content'}
			className={'my-0.5 rounded-sm bg-neutral-100/50 transition-colors open:bg-neutral-100 hover:bg-neutral-100'}>
			<summary className={'grid grid-cols-12 p-4'}>
				<div className={'col-span-12 flex w-full flex-row items-center space-x-6 md:col-span-5'}>
					<div className={'h-10 w-10 min-w-[40px]'}>
						<ImageWithFallback
							key={`https://assets.smold.app/api/token/${safeChainID}/${toAddress(item?.protocol)}/logo-128.png`}
							src={`https://assets.smold.app/api/token/${safeChainID}/${toAddress(item?.protocol)}/logo-128.png`}
							alt={''}
							unoptimized
							width={40}
							height={40} />
					</div>
					<div className={'flex flex-col'}>
						<p className={'whitespace-nowrap'}>
							{item?.protocolSymbol || truncateHex(item.protocol, 6)}
						</p>
						<small className={'whitespace-nowrap text-xs'}>
							{item.protocolName}
						</small>
					</div>
				</div>
				<div className={'col-span-12 mt-4 flex justify-between md:col-span-2 md:mt-0 md:justify-end'}>
					<small className={'block text-neutral-500 md:hidden'}>
						{'Total incentive (USD)'}
					</small>
					<p className={'font-number'}>
						{`$${formatAmount(item.normalizedSum || 0, 2, 2)}`}
					</p>
				</div>
				<div className={'col-span-12 mt-2 flex justify-between md:col-span-2 md:mt-0 md:justify-end'}>
					<small className={'block text-neutral-500 md:hidden'}>
						{'USD/st-yETH'}
					</small>
					<p className={'font-number'}>
						{`${formatAmount(item.usdPerStETH || 0, 2, 2)}`}
					</p>
				</div>
				<div className={'col-span-12 mt-2 flex justify-between md:col-span-2 md:mt-0 md:justify-end'}>
					<small className={'block text-neutral-500 md:hidden'}>
						{'st-yETH vAPR'}
					</small>
					<p className={'font-number'}>
						{`${formatPercent(item.estimatedAPR, 2)}`}
					</p>
				</div>
				<div className={'col-span-1 hidden justify-end md:flex'}>
					<IconChevronBottom className={'chev h-6 w-6 text-neutral-900'} />
				</div>
			</summary>

			<div>
				<IncentiveGroupBreakdown incentives={item.incentives} />
			</div>
		</details>
	);
}

function IncentiveHistory({isPending, incentives}: {isPending: boolean, incentives: TIncentivesFor}): ReactElement {
	const [sortBy, set_sortBy] = useState<string>('totalIncentive');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('desc');

	/* 🔵 - Yearn Finance **************************************************************************
	**	Callback method used to sort the vaults list.
	**	The use of useCallback() is to prevent the method from being re-created on every render.
	**********************************************************************************************/
	const onSort = useCallback((newSortBy: string, newSortDirection: string): void => {
		performBatchedUpdates((): void => {
			set_sortBy(newSortBy);
			set_sortDirection(newSortDirection as TSortDirection);
		});
	}, []);

	const toggleSortDirection = (newSortBy: string): TSortDirection => {
		return sortBy === newSortBy ? (
			sortDirection === '' ? 'desc' : sortDirection === 'desc' ? 'asc' : 'desc'
		) : 'desc';
	};

	const renderChevron = useCallback((shouldSortBy: boolean): ReactElement => {
		if (shouldSortBy && sortDirection === 'desc') {
			return <IconChevronPlain className={'yearn--sort-chevron transition-all'} />;
		}
		if (shouldSortBy && sortDirection === 'asc') {
			return <IconChevronPlain className={'yearn--sort-chevron rotate-180 transition-all'} />;
		}
		return <IconChevronPlain className={'yearn--sort-chevron--off text-neutral-300 transition-all group-hover:text-neutral-500'} />;
	}, [sortDirection]);

	return (
		<div className={'mt-2 px-4 pt-8 md:px-72'}>

			<b className={'text-xl font-black'}>
				{'Incentives'}
			</b>


			<div aria-label={'header'} className={'mb-4 hidden grid-cols-12 px-4 md:grid'}>
				<div className={'col-span-5'}>
					<p className={'text-xs text-neutral-500'}>
						{'LST'}
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('totalIncentive', toggleSortDirection('totalIncentive'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'Total incentive (USD)'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'totalIncentive')}
						</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('usdPerStETH', toggleSortDirection('usdPerStETH'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'USD/st-yETH'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'usdPerStETH')}
						</span>
					</p>
				</div>
				<div className={'col-span-2 flex justify-end'}>
					<p
						onClick={(): void => onSort('vapr', toggleSortDirection('vapr'))}
						className={'group flex flex-row text-xs text-neutral-500'}>
						{'st-yETH vAPR'}
						<span className={'pl-2'}>
							{renderChevron(sortBy === 'vapr')}
						</span>
					</p>
				</div>
				<div className={'col-span-1 flex justify-end'} />
			</div>

			{Object.values(incentives.protocols)
				.filter((e): boolean => Boolean(e))
				.sort((a, b): number => {
					let aValue = 0;
					let bValue = 0;
					if (sortBy === 'totalIncentive') {
						aValue = a.normalizedSum;
						bValue = b.normalizedSum;
					} else if (sortBy === 'vapr') {
						aValue = a.estimatedAPR;
						bValue = b.estimatedAPR;
					} else if (sortBy === 'usdPerStETH') {
						aValue = a.usdPerStETH;
						bValue = b.usdPerStETH;
					}
					return sortDirection === 'desc' ? Number(bValue) - Number(aValue) : Number(aValue) - Number(bValue);
				})
				.map((item, index): ReactElement => <IncentiveGroup key={index} item={item} />)}

			{isPending && (
				<div className={'mt-6 flex flex-row items-center justify-center'}>
					<IconSpinner className={'!h-6 !w-6 !text-neutral-400'} />
				</div>
			)}
		</div>
	);
}

function ViewHeader(): ReactElement {
	const {incentives: {groupIncentiveHistory, totalDepositedUSD}} = useBootstrap();

	/* 🔵 - Yearn Finance **************************************************************************
	** Calculate the sum of all the incentives for all the protocols.
	**********************************************************************************************/
	const sumOfAllIncentives = useMemo((): number => {
		let sum = 0;
		for (const eachIncentive of Object.values(groupIncentiveHistory.protocols)) {
			sum += eachIncentive.normalizedSum;
		}
		return sum;
	}, [groupIncentiveHistory]);

	return (
		<div className={'mb-10 flex w-full flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>
				{'Incentivize'}
			</h1>
			<b
				suppressHydrationWarning
				className={'font-number mt-4 text-4xl text-purple-300'}>
				<Timer />
			</b>
			<div className={'flex w-full flex-col items-center gap-4 md:grid-cols-1 md:flex-row md:gap-6'}>
				<div className={'w-full'}>
					<p className={'text-neutral-700'}>
						{'st-yETH holders, it’s time to be (metaphorically) wined and dined by the LST protocols vying for a spot in yETH. Decide which LST gets your votes below, and remember you will recieve incentives from the winning LSTs whether you voted for them or not. So follow your heart anon.'}
					</p>
				</div>
				<div className={'flex w-full justify-end space-x-4 md:w-auto'}>
					<div className={'w-full min-w-[200px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'whitespace-nowrap pb-2'}>{'Current total deposits, USD'}</p>
						<b suppressHydrationWarning className={'font-number text-3xl'}>
							<Renderable shouldRender={true} fallback ={'-'}>
								{amountV2({value: totalDepositedUSD, decimals: 2, symbol: '$'})}
							</Renderable>
						</b>
					</div>
					<div className={'w-full min-w-[200px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'whitespace-nowrap pb-2'}>{'Current total incentives, USD'}</p>
						<b suppressHydrationWarning className={'font-number text-3xl'}>
							<Renderable shouldRender={true} fallback ={'-'}>
								{amountV2({value: sumOfAllIncentives, decimals: 2, symbol: '$'})}
							</Renderable>
						</b>
					</div>
				</div>
			</div>
		</div>
	);
}

function ViewSelectIncentive({onOpenModal}: {onOpenModal: VoidFunction}): ReactElement {
	const {address, isActive, provider} = useWeb3();
	const {safeChainID} = useChainID(Number(process.env.BASE_CHAIN_ID));
	const {balances, refresh} = useWallet();
	const {tokenList} = useTokenList();
	const {whitelistedLST, periods: {incentiveStatus}} = useBootstrap();
	const [currentTab, set_currentTab] = useState<'current' | 'potential'>('current');
	const [amountToSend, set_amountToSend] = useState<TNormalizedBN>(toNormalizedBN(0));
	const [possibleTokensToUse, set_possibleTokensToUse] = useState<TDict<TTokenInfo | undefined>>({});
	const [lstToIncentive, set_lstToIncentive] = useState<TTokenInfo | undefined>();
	const [tokenToUse, set_tokenToUse] = useState<TTokenInfo | undefined>();
	const [approvalStatus, set_approvalStatus] = useState<TTxStatus>(defaultTxStatus);
	const {data: allowanceOf, refetch: refetchAllowance} = useContractRead({
		abi: erc20ABI,
		address: tokenToUse?.address,
		functionName: 'allowance',
		args: [toAddress(address), toAddress(process.env.BOOTSTRAP_ADDRESS)]
	});


	/* 🔵 - Yearn Finance **************************************************************************
	** On mount, fetch the token list from the tokenlistooor repo for the cowswap token list, which
	** will be used to populate the token combobox.
	** Only the tokens in that list will be displayed.
	**********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: TDict<TTokenInfo> = {};
		for (const eachToken of Object.values(tokenList)) {
			if (eachToken.chainId === safeChainID) {
				possibleDestinationsTokens[toAddress(eachToken.address)] = eachToken;
			}
		}
		set_possibleTokensToUse(possibleDestinationsTokens);
	}, [tokenList, safeChainID]);

	/* 🔵 - Yearn Finance **************************************************************************
	** On balance or token change, update the balance of the token to use.
	**********************************************************************************************/
	const balanceOf = useMemo((): TNormalizedBN => {
		if (!tokenToUse) {
			return toNormalizedBN(0);
		}
		return toNormalizedBN((balances?.[tokenToUse.address]?.raw || 0) || 0, tokenToUse.decimals || 18);
	}, [balances, tokenToUse]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Change the inputed amount when the user types something in the input field.
	**********************************************************************************************/
	const onChangeAmount = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
		if (!tokenToUse) {
			return;
		}
		const element = document.getElementById('amountToSend') as HTMLInputElement;
		const newAmount = handleInputChangeEventValue(e, tokenToUse?.decimals || 18);
		if (newAmount.raw > balances?.[tokenToUse.address]?.raw) {
			if (element?.value) {
				element.value = formatAmount(balances?.[tokenToUse.address]?.normalized, 0, 18);
			}
			return set_amountToSend(toNormalizedBN(
				balances?.[tokenToUse.address]?.raw || 0,
				tokenToUse.decimals || 18
			));
		}
		set_amountToSend(newAmount);
	}, [balances, tokenToUse]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Change the inputed amount when the user select a percentage to set.
	**********************************************************************************************/
	const updateToPercent = useCallback((percent: number): void => {
		if (!tokenToUse) {
			return;
		}
		const element = document.getElementById('amountToSend') as HTMLInputElement;
		const newAmount = toNormalizedBN(
			(balanceOf.raw * BigInt(percent)) / 100n,
			tokenToUse.decimals || 18
		);
		if (newAmount.raw > balances?.[tokenToUse.address]?.raw) {
			if (element?.value) {
				element.value = formatAmount(
					balances?.[tokenToUse.address]?.normalized, 0, 18);
			}
			return set_amountToSend(toNormalizedBN(
				balances?.[tokenToUse.address]?.raw || 0,
				tokenToUse.decimals || 18
			));
		}
		set_amountToSend(newAmount);
	}, [balanceOf, balances, tokenToUse]);

	/* 🔵 - Yearn Finance **************************************************************************
	** View function to round the amount and make it match to a known percentage.
	**********************************************************************************************/
	const amountPercentage = useMemo((): number => {
		const percent = Number(amountToSend.normalized) / Number(balanceOf.normalized) * 100;
		return Math.round(percent * 100) / 100;
	}, [amountToSend.normalized, balanceOf.normalized]);

	/* 🔵 - Yearn Finance **************************************************************************
	** View function to check if the user has enough allowance for the token/amount to send.
	**********************************************************************************************/
	const hasAllowance = useMemo((): boolean => {
		return (toBigInt(allowanceOf) >= amountToSend.raw);
	}, [allowanceOf, amountToSend.raw]);

	/* 🔵 - Yearn Finance **************************************************************************
	** Web3 action to incentivize a given protocol with a given token and amount.
	**********************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
		assert(isActive, 'Wallet not connected');
		assert(provider, 'Provider not connected');
		assert(amountToSend.raw > 0n, 'Amount must be greater than 0');
		assertAddress(tokenToUse?.address, 'Token to use not selected');

		const result = await approveERC20({
			connector: provider,
			contractAddress: tokenToUse.address,
			spenderAddress: toAddress(process.env.BOOTSTRAP_ADDRESS),
			amount: amountToSend.raw,
			statusHandler: set_approvalStatus
		});
		if (result.isSuccessful) {
			refetchAllowance();
			await refresh([
				{...ETH_TOKEN, token: ETH_TOKEN.address},
				{
					decimals: tokenToUse.decimals,
					name: tokenToUse.name,
					symbol: tokenToUse.symbol,
					token: tokenToUse.address
				}
			]);
		}
	}, [amountToSend.raw, isActive, provider, refresh, tokenToUse, refetchAllowance]);


	return (
		<div className={'overflow-hidden bg-neutral-100 pt-4'}>
			<IncentiveMenuTabs
				currentTab={currentTab}
				set_currentTab={set_currentTab} />
			<div className={'p-4 md:px-72 md:py-10'}>
				<b className={'text-xl font-black'}>{'Select LST to incentivize '}</b>

				<div className={'mt-4 grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-4 lg:gap-4'}>
					<div>
						<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'Select LST'}</p>
						<ComboboxAddressInput
							value={lstToIncentive?.address}
							possibleValues={whitelistedLST.whitelistedLST}
							onChangeValue={set_lstToIncentive} />
						<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
					</div>

					<div className={'pt-2 md:pt-0'}>
						<p className={'truncate pb-1 text-sm text-neutral-600 md:text-base'}>{'Select token to incentivize with'}</p>
						<ComboboxAddressInput
							value={tokenToUse?.address}
							possibleValues={possibleTokensToUse}
							onAddValue={set_possibleTokensToUse}
							onChangeValue={set_tokenToUse} />
						<p className={'hidden pt-1 text-xs lg:block'}>&nbsp;</p>
					</div>

					<div className={'pt-2 md:pt-0'}>
						<p className={'pb-1 text-sm text-neutral-600 md:text-base'}>{'Amount'}</p>
						<div className={'box-500 grow-1 flex h-10 w-full items-center justify-center p-2'}>
							<div className={'mr-2 h-6 w-6 min-w-[24px]'}>
								<ImageWithFallback
									alt={''}
									unoptimized
									key={tokenToUse?.logoURI || ''}
									src={tokenToUse?.logoURI || ''}
									width={24}
									height={24} />
							</div>
							<input
								id={'amountToSend'}
								className={'w-full overflow-x-scroll border-none bg-transparent px-0 py-4 font-mono text-sm outline-none scrollbar-none'}
								type={'number'}
								min={0}
								maxLength={20}
								max={balanceOf?.normalized || 0}
								step={1 / 10 ** (tokenToUse?.decimals || 18)}
								inputMode={'numeric'}
								placeholder={'0'}
								pattern={'^((?:0|[1-9]+)(?:.(?:d+?[1-9]|[1-9]))?)$'}
								value={amountToSend?.normalized || ''}
								onChange={onChangeAmount} />
							<div className={'ml-2 flex flex-row space-x-1'}>
								<button
									onClick={(): void => updateToPercent(100)}
									className={cl('p-1 text-xs rounded-sm border border-purple-300 transition-colors', amountPercentage === 100 ? 'bg-purple-300 text-white' : 'text-purple-300 hover:bg-purple-300 hover:text-white')}>
									{'max'}
								</button>

							</div>
						</div>
						<small
							suppressHydrationWarning
							className={'pl-2 pt-1 text-xs text-neutral-600'}>
							{`You have ${formatAmount(balanceOf?.normalized || 0, 2, 6)} ${tokenToUse?.symbol || '-'}`}
						</small>
					</div>

					<div className={'w-full pt-4 md:pt-0'}>
						<p className={'hidden pb-1 text-neutral-600 md:block'}>&nbsp;</p>
						<Button
							onClick={(): unknown => hasAllowance ? onOpenModal() : onApprove()}
							isBusy={approvalStatus.pending}
							isDisabled={
								!approvalStatus.none
									|| incentiveStatus !== 'started'
									|| amountToSend.raw === 0n
									|| amountToSend.raw > balanceOf.raw
									|| !isValidAddress(lstToIncentive?.address)
									|| !isValidAddress(tokenToUse?.address)
							}
							className={'yearn--button w-full rounded-md !text-sm'}>
							{hasAllowance ? 'Submit' : 'Approve'}
						</Button>
						<p className={'pl-2 pt-1 text-xs text-neutral-600'}>&nbsp;</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function ViewIncentive(): ReactElement {
	const {incentives: {groupIncentiveHistory, isFetchingHistory}} = useBootstrap();

	return (
		<section className={'grid grid-cols-1 pt-10 md:mb-20 md:pt-12'}>
			<div className={'mb-20 md:mb-0'}>
				<ViewHeader />

				<ViewSelectIncentive onOpenModal={(): void => undefined} />

				<div className={'bg-neutral-100'}>
					<IncentiveHistory
						isPending={isFetchingHistory}
						incentives={groupIncentiveHistory} />
				</div>
			</div>
		</section>
	);
}

export default ViewIncentive;
