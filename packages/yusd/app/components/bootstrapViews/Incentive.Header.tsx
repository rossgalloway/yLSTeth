import React, {useMemo} from 'react';
import {formatTAmount} from '@builtbymom/web3/utils';
import {Renderable} from '@yearn-finance/web-lib/components/Renderable';
import useBootstrap from '@yUSD/contexts/useBootstrap';
import useLST from '@yUSD/contexts/useLST';

import {Timer} from './Timer';

import type {ReactElement} from 'react';

function IncentiveHeader(): ReactElement {
	const {totalDeposited} = useLST();
	const {
		incentives: {groupIncentiveHistory},
		periods: {incentiveEnd, incentiveStatus}
	} = useBootstrap();
	/* 🔵 - Yearn Finance **************************************************************************
	 ** Calculate the sum of all the incentives for all the protocols.
	 **********************************************************************************************/
	const sumOfAllIncentives = useMemo((): number => {
		let sum = 0;
		for (const eachIncentive of Object.values(groupIncentiveHistory.protocols)) {
			sum += eachIncentive.normalizedSum;
		}
		return sum;
	}, [groupIncentiveHistory.protocols]);

	return (
		<div className={'mb-10 flex w-full flex-col justify-center'}>
			<h1 className={'text-3xl font-black md:text-8xl'}>{'Incentivize'}</h1>
			<Timer
				endTime={Number(incentiveEnd)}
				status={incentiveStatus}
			/>
			<div className={'mt-6 flex w-full flex-col items-start gap-4 md:grid-cols-1 md:flex-row md:gap-6'}>
				<div className={'w-full'}>
					<p className={'text-neutral-700'}>
						{
							'Pick which STABLE you are incentivizing for, and which token you’ll be posting the incentive in. Remember, if your token is not included in the final yUSD basket you’ll be refunded the full amount of your incentive.'
						}
					</p>
				</div>
				<div
					className={
						'flex w-full flex-col justify-end space-y-4 pb-2 md:-mt-10 md:w-auto md:flex-row md:space-x-4 md:space-y-0'
					}>
					<div className={'w-full min-w-[200px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'whitespace-nowrap pb-2'}>{'Current total deposits, USD'}</p>
						<b
							suppressHydrationWarning
							className={'font-number text-3xl'}>
							<Renderable
								shouldRender={true}
								fallback={'-'}>
								{formatTAmount({value: totalDeposited.normalized, decimals: 2, symbol: '$'})}
							</Renderable>
						</b>
					</div>
					<div className={'w-full min-w-[200px] bg-neutral-100 p-4 md:w-fit'}>
						<p className={'whitespace-nowrap pb-2'}>{'Current total incentives, USD'}</p>
						<b
							suppressHydrationWarning
							className={'font-number text-3xl'}>
							<Renderable
								shouldRender={true}
								fallback={'-'}>
								{formatTAmount({value: sumOfAllIncentives, decimals: 2, symbol: '$'})}
							</Renderable>
						</b>
					</div>
				</div>
			</div>
		</div>
	);
}

export {IncentiveHeader};
