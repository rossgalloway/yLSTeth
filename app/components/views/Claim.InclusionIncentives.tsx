import React, {Fragment, useCallback, useEffect, useMemo, useState} from 'react';
import {claimManyInclusionIncentive} from 'app/actions';
import useInclusion from 'app/contexts/useInclusion';
import {usePrices} from 'app/contexts/usePrices';
import {INCLUSION_INCENTIVE_ABI} from 'app/utils/abi/inclusionIncentives.abi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {decodeAsBigInt, formatAmount, toAddress, toNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {readContracts} from '@wagmi/core';
import {Button} from '@yearn-finance/web-lib/components/Button';

import {ImageWithFallback} from '../common/ImageWithFallback';

import type {TTokenIncentive} from 'app/utils/types';
import type {ReactElement} from 'react';
import type {TAddress, TDict} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

function InclusionIncentiveList(props: {
	claimableInclusionIncentives: TTokenIncentive[];
	unselectedIncentive: TDict<boolean>;
	set_unselectedIncentives: (unselectedIncentive: TDict<boolean>) => void;
}): ReactElement {
	const {getPrice} = usePrices();

	if (props.claimableInclusionIncentives.length === 0) {
		return <Fragment />;
	}

	return (
		<div className={'mt-4 grid gap-2 border-t border-neutral-300 pt-4'}>
			{Object.values(props.claimableInclusionIncentives || {}).map((incentive, index): ReactElement => {
				return (
					<label
						key={index}
						htmlFor={incentive.address}
						className={'flex w-full cursor-pointer flex-row items-center gap-2'}>
						<div>
							<input
								id={incentive.address}
								onChange={(e): void =>
									props.set_unselectedIncentives({
										...props.unselectedIncentive,
										[incentive.address]: !e.target.checked
									})
								}
								checked={!props.unselectedIncentive[incentive.address]}
								type={'checkbox'}
								className={
									'focus:ring-purple-300 -mt-1 size-[14px] rounded-[4px] border-0 border-neutral-400 bg-neutral-200 text-purple-300 indeterminate:ring-2 focus:bg-neutral-200 focus:ring-2 focus:ring-offset-neutral-100'
								}
							/>
						</div>
						<div className={'size-5 min-w-[20px]'}>
							<ImageWithFallback
								alt={''}
								unoptimized
								src={incentive?.logoURI || ''}
								altSrc={`${process.env.SMOL_ASSETS_URL}/token/${Number(process.env.DEFAULT_CHAIN_ID)}/${incentive?.address}/logo-32.png`}
								width={20}
								height={20}
							/>
						</div>
						<div className={'flex w-full flex-row items-center justify-between'}>
							<small className={'font-sans text-xs text-neutral-900'}>{incentive.name}</small>
							<small className={'font-mono text-xs text-neutral-900'}>
								{`$`}
								{formatAmount(
									incentive.amount.normalized * getPrice({address: incentive.address}).normalized,
									4,
									4
								)}
							</small>
						</div>
					</label>
				);
			})}
		</div>
	);
}

function ClaimInclusionIncentives(props: {epoch: bigint | undefined}): ReactElement {
	const {address, provider} = useWeb3();
	const {
		inclusionIncentives,
		getIncentivesForEpoch,
		refreshEpochIncentives,
		isLoaded: isInclusionLoaded
	} = useInclusion();
	const [claimableInclusionIncentives, set_claimableInclusionIncentives] = useState<TTokenIncentive[]>([]);
	const [unselectedIncentive, set_unselectedIncentives] = useState<TDict<boolean>>({});
	const [claimStatus, set_claimStatus] = useState<TTxStatus>(defaultTxStatus);
	const [isLoaded, set_isLoaded] = useState<boolean>(false);
	const [epoch, set_epoch] = useState<bigint | undefined>(props.epoch);
	const {getPrice} = usePrices();

	/**********************************************************************************************
	 ** If the epoch isn't set, we can set it to the current epoch minus 1, aka the one that was
	 ** just finished.
	 **********************************************************************************************/
	useEffect(() => {
		if (props.epoch) {
			set_epoch(props.epoch);
			const {hasData} = getIncentivesForEpoch(props.epoch);
			if (!hasData) {
				refreshEpochIncentives(props.epoch);
			}
		}
	}, [props.epoch, getIncentivesForEpoch, refreshEpochIncentives]);

	/**********************************************************************************************
	 ** Something used to filter the incentives you don't want to claim.
	 **********************************************************************************************/
	const tokensToClaim = useMemo((): TTokenIncentive[] => {
		return claimableInclusionIncentives.filter(incentive => !unselectedIncentive[incentive.address]);
	}, [claimableInclusionIncentives, unselectedIncentive]);

	/**********************************************************************************************
	 ** Create the array matching all the epochs.
	 **********************************************************************************************/
	const getClaimableInclusionIncentives = useCallback(async () => {
		if (!address || !inclusionIncentives) {
			set_claimableInclusionIncentives([]);
			return;
		}

		/******************************************************************************************
		 ** Create an array of all the incentives tokens to check if the user has some that might
		 ** be claimable.
		 ** Also store the token data for later use
		 ******************************************************************************************/
		const allIncentivesTokens: TAddress[] = [];
		const allIncentivesTokensData: TDict<TTokenIncentive[]> = {};
		for (const elem of Object.values(inclusionIncentives)) {
			for (const [addr, data] of Object.entries(elem)) {
				if (!allIncentivesTokensData[toAddress(addr)]) {
					allIncentivesTokensData[toAddress(addr)] = [];
				}
				allIncentivesTokensData[toAddress(addr)].push(...data);

				if (allIncentivesTokens.includes(toAddress(addr))) {
					continue;
				}
				allIncentivesTokens.push(toAddress(addr));
			}
		}

		/******************************************************************************************
		 ** Retrieve the onChain claimable for the connected user
		 ******************************************************************************************/
		const claimable = await readContracts(retrieveConfig(), {
			contracts: allIncentivesTokens.map(elem => ({
				abi: INCLUSION_INCENTIVE_ABI,
				chainId: Number(process.env.DEFAULT_CHAIN_ID),
				address: toAddress(process.env.INCLUSION_INCENTIVES_ADDRESS),
				functionName: 'claimable',
				args: [epoch, elem, toAddress(address)]
			}))
		});

		/******************************************************************************************
		 ** Loop over the result to create the claimable data. When the claimable amount is 0, we
		 ** can skip the token.
		 ******************************************************************************************/
		const claimData: TTokenIncentive[] = [];
		for (let i = 0; i < allIncentivesTokens.length; i++) {
			const token = allIncentivesTokens[i];
			const data = allIncentivesTokensData[token];
			const claimableData = decodeAsBigInt(claimable[i]);
			if (claimableData === 0n) {
				continue;
			}
			claimData.push({
				...data[0],
				amount: toNormalizedBN(claimableData, data[0].decimals)
			});
		}
		set_claimableInclusionIncentives(claimData);
	}, [address, inclusionIncentives, epoch]);

	/**********************************************************************************************
	 ** Callback function used to refresh the claimable data, aka to find, for a given epoch, all
	 ** the incentives you can claim.
	 **********************************************************************************************/
	const onRefreshClaimableData = useAsyncTrigger(async (): Promise<void> => {
		if (!epoch || !isInclusionLoaded) {
			return;
		}
		set_isLoaded(false);
		await getClaimableInclusionIncentives();
		setTimeout(() => set_isLoaded(true), 1000);
	}, [epoch, getClaimableInclusionIncentives, isInclusionLoaded]);

	/**********************************************************************************************
	 ** Compute the total amount of incentives you already claimed.
	 **
	 ** @deps: claimableInclusionIncentives - The list of all the incentives you can claim.
	 ** @returns: number - The total amount of incentives you can claim.
	 **********************************************************************************************/
	const totalToClaim = useMemo((): number => {
		let sum = 0;
		for (const incentive of Object.values(claimableInclusionIncentives)) {
			const price = getPrice({address: incentive.address});
			sum += incentive.amount.normalized * price.normalized;
		}
		return sum;
	}, [getPrice, claimableInclusionIncentives]);

	/**********************************************************************************************
	 ** Claim all the selected incentives.
	 **********************************************************************************************/
	async function onClaim(): Promise<void> {
		if (!provider || !epoch) {
			return;
		}
		const result = await claimManyInclusionIncentive({
			connector: provider,
			contractAddress: toAddress(process.env.INCLUSION_INCENTIVES_ADDRESS),
			chainID: Number(process.env.DEFAULT_CHAIN_ID),
			epochs: tokensToClaim.map(() => epoch),
			tokens: tokensToClaim.map(incentive => toAddress(incentive.address)),
			statusHandler: set_claimStatus
		});
		if (result.isSuccessful) {
			onRefreshClaimableData();
		}
	}

	return (
		<div className={'flex flex-col gap-10 md:flex-row md:gap-20'}>
			<div className={'flex w-full flex-col lg:w-[352px]'}>
				<div className={'mb-4 w-full bg-neutral-100 p-4'}>
					<p className={'pb-2'}>{'Your claimable inclusion incentives, $'}</p>
					{isLoaded ? (
						<>
							<b
								suppressHydrationWarning
								className={'font-number text-3xl'}>
								{`$${formatAmount(totalToClaim, 2, 2)}`}
							</b>
							<InclusionIncentiveList
								unselectedIncentive={unselectedIncentive}
								set_unselectedIncentives={set_unselectedIncentives}
								claimableInclusionIncentives={claimableInclusionIncentives}
							/>
						</>
					) : (
						<div className={'skeleton-lg col-span-5 h-10 w-2/3'} />
					)}
				</div>

				<Button
					isBusy={claimStatus.pending}
					onClick={onClaim}
					isDisabled={!isLoaded || claimableInclusionIncentives.length === 0 || tokensToClaim.length === 0}
					className={'yearn--button w-full rounded-md !text-sm'}>
					{'Claim'}
				</Button>
			</div>
		</div>
	);
}

export {ClaimInclusionIncentives};
