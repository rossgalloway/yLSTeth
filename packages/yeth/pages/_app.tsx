import React from 'react';
import localFont from 'next/font/local';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {arbitrum, base, fantom, mainnet, optimism, polygon} from 'viem/chains';
import {AnimatePresence, motion} from 'framer-motion';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {cl} from '@builtbymom/web3/utils/cl';
import {motionVariants} from '@builtbymom/web3/utils/helpers';
import {localhost} from '@builtbymom/web3/utils/wagmi';
import AppHeader from '@libComponents/Header';
import {BasketContextApp} from '@yETH/contexts/useBasket';
import {InclusionContextApp} from '@yETH/contexts/useInclusion';
import {LSTContextApp} from '@yETH/contexts/useLST';
import {PriceContextApp} from '@yETH/contexts/usePrices';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';
import type {Chain} from 'viem/chains';

import '../style.css';

const aeonik = localFont({
	variable: '--font-aeonik',
	display: 'swap',
	src: [
		{
			path: '../public/fonts/Aeonik-Regular.woff2',
			weight: '400',
			style: 'normal'
		},
		{
			path: '../public/fonts/Aeonik-Bold.woff2',
			weight: '700',
			style: 'normal'
		},
		{
			path: '../public/fonts/Aeonik-Black.ttf',
			weight: '900',
			style: 'normal'
		}
	]
});

/****************************************************************************************************
 ** This function wraps the application's components, providing layout and animation for page transitions.
 ** @param props - The properties passed to the AppWrapper, including AppProps and supportedNetworks
 ** @return ReactElement - The wrapped application components with layout and animations
 ****************************************************************************************************/
function AppWrapper(props: AppProps & {supportedNetworks: Chain[]}): ReactElement {
	const router = useRouter();
	const {Component, pageProps} = props;

	return (
		<div
			id={'app'}
			className={cl('mx-auto mb-0 flex font-aeonik w-full transition-colors duration-700')}>
			<div className={'block size-full min-h-max'}>
				<AppHeader version={'live'} />
				<div className={'mx-auto my-0 w-full max-w-6xl pt-4 md:mb-0 md:!px-0'}>
					<AnimatePresence mode={'wait'}>
						<motion.div
							key={router.pathname}
							initial={'initial'}
							animate={'enter'}
							exit={'exit'}
							className={'my-0 size-full md:mb-16'}
							variants={motionVariants}>
							<Component
								router={props.router}
								{...pageProps}
							/>
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}

/****************************************************************************************************
 ** This is the main application component that sets up the context providers and the application's
 ** structure.
 ** @param props - The properties passed to MyApp, including AppProps
 ** @return ReactElement - The main application component wrapped with context providers
 ****************************************************************************************************/
const supportedNetworks = [mainnet, optimism, polygon, fantom, base, arbitrum, localhost];
function MyApp(props: AppProps): ReactElement {
	return (
		<>
			<Head>
				<style
					jsx
					global>
					{`
						html {
							font-family: ${aeonik.style.fontFamily};
						}
					`}
				</style>
			</Head>
			<WithMom
				supportedChains={supportedNetworks}
				tokenLists={[
					'https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/yearn.json',
					'https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/smolAssets.json'
				]}>
				<PriceContextApp>
					<WalletContextApp>
						<LSTContextApp>
							<BasketContextApp>
								<InclusionContextApp>
									<main className={cl('flex flex-col mb-32', aeonik.className)}>
										<AppWrapper
											supportedNetworks={supportedNetworks}
											{...props}
										/>
									</main>
								</InclusionContextApp>
							</BasketContextApp>
						</LSTContextApp>
					</WalletContextApp>
				</PriceContextApp>
			</WithMom>
		</>
	);
}

export default MyApp;
