export const INCLUSION_ABI = [
	{
		name: 'Apply',
		inputs: [
			{name: 'epoch', type: 'uint256', indexed: true},
			{name: 'token', type: 'address', indexed: true},
			{name: 'account', type: 'address', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Whitelist',
		inputs: [
			{name: 'epoch', type: 'uint256', indexed: true},
			{name: 'token', type: 'address', indexed: true},
			{name: 'idx', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Vote',
		inputs: [
			{name: 'epoch', type: 'uint256', indexed: true},
			{name: 'account', type: 'address', indexed: true},
			{name: 'weight', type: 'uint256', indexed: false},
			{name: 'votes', type: 'uint256[]', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'Finalize',
		inputs: [
			{name: 'epoch', type: 'uint256', indexed: true},
			{name: 'winner', type: 'address', indexed: true}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'SetRateProvider',
		inputs: [
			{name: 'token', type: 'address', indexed: true},
			{name: 'provider', type: 'address', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'SetEnableEpoch',
		inputs: [{name: 'epoch', type: 'uint256', indexed: false}],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'SetOperator',
		inputs: [{name: 'operator', type: 'address', indexed: true}],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'SetTreasury',
		inputs: [{name: 'treasury', type: 'address', indexed: true}],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'SetFeeToken',
		inputs: [{name: 'fee_token', type: 'address', indexed: true}],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'SetFees',
		inputs: [
			{name: 'initial', type: 'uint256', indexed: false},
			{name: 'subsequent', type: 'uint256', indexed: false}
		],
		anonymous: false,
		type: 'event'
	},
	{name: 'SetMeasure', inputs: [{name: 'measure', type: 'address', indexed: true}], anonymous: false, type: 'event'},
	{
		name: 'PendingManagement',
		inputs: [{name: 'management', type: 'address', indexed: true}],
		anonymous: false,
		type: 'event'
	},
	{
		name: 'SetManagement',
		inputs: [{name: 'management', type: 'address', indexed: true}],
		anonymous: false,
		type: 'event'
	},
	{
		stateMutability: 'nonpayable',
		type: 'constructor',
		inputs: [
			{name: '_genesis', type: 'uint256'},
			{name: '_measure', type: 'address'},
			{name: '_fee_token', type: 'address'}
		],
		outputs: []
	},
	{stateMutability: 'view', type: 'function', name: 'epoch', inputs: [], outputs: [{name: '', type: 'uint256'}]},
	{stateMutability: 'view', type: 'function', name: 'apply_open', inputs: [], outputs: [{name: '', type: 'bool'}]},
	{stateMutability: 'view', type: 'function', name: 'vote_open', inputs: [], outputs: [{name: '', type: 'bool'}]},
	{stateMutability: 'view', type: 'function', name: 'enabled', inputs: [], outputs: [{name: '', type: 'bool'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'has_applied',
		inputs: [{name: '_token', type: 'address'}],
		outputs: [{name: '', type: 'bool'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'application_fee',
		inputs: [{name: '_token', type: 'address'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'apply',
		inputs: [{name: '_token', type: 'address'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'whitelist',
		inputs: [{name: '_tokens', type: 'address[]'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'vote',
		inputs: [{name: '_votes', type: 'uint256[]'}],
		outputs: []
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'latest_finalized_epoch',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{stateMutability: 'nonpayable', type: 'function', name: 'finalize_epochs', inputs: [], outputs: []},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_rate_provider',
		inputs: [
			{name: '_token', type: 'address'},
			{name: '_provider', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'sweep',
		inputs: [{name: '_token', type: 'address'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'sweep',
		inputs: [
			{name: '_token', type: 'address'},
			{name: '_recipient', type: 'address'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_operator',
		inputs: [{name: '_operator', type: 'address'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_treasury',
		inputs: [{name: '_treasury', type: 'address'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_measure',
		inputs: [{name: '_measure', type: 'address'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_enable_epoch',
		inputs: [{name: '_epoch', type: 'uint256'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_application_fee_token',
		inputs: [{name: '_token', type: 'address'}],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_application_fees',
		inputs: [
			{name: '_initial', type: 'uint256'},
			{name: '_subsequent', type: 'uint256'}
		],
		outputs: []
	},
	{
		stateMutability: 'nonpayable',
		type: 'function',
		name: 'set_management',
		inputs: [{name: '_management', type: 'address'}],
		outputs: []
	},
	{stateMutability: 'nonpayable', type: 'function', name: 'accept_management', inputs: [], outputs: []},
	{stateMutability: 'view', type: 'function', name: 'genesis', inputs: [], outputs: [{name: '', type: 'uint256'}]},
	{stateMutability: 'view', type: 'function', name: 'management', inputs: [], outputs: [{name: '', type: 'address'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'pending_management',
		inputs: [],
		outputs: [{name: '', type: 'address'}]
	},
	{stateMutability: 'view', type: 'function', name: 'operator', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'treasury', inputs: [], outputs: [{name: '', type: 'address'}]},
	{stateMutability: 'view', type: 'function', name: 'measure', inputs: [], outputs: [{name: '', type: 'address'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'enable_epoch',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'num_candidates',
		inputs: [{name: 'arg0', type: 'uint256'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'candidates',
		inputs: [
			{name: 'arg0', type: 'uint256'},
			{name: 'arg1', type: 'uint256'}
		],
		outputs: [{name: '', type: 'address'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'candidates_map',
		inputs: [
			{name: 'arg0', type: 'uint256'},
			{name: 'arg1', type: 'address'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'applications',
		inputs: [{name: 'arg0', type: 'address'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'rate_providers',
		inputs: [{name: 'arg0', type: 'address'}],
		outputs: [{name: '', type: 'address'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'total_votes',
		inputs: [{name: 'arg0', type: 'uint256'}],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'votes',
		inputs: [
			{name: 'arg0', type: 'uint256'},
			{name: 'arg1', type: 'uint256'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'votes_user',
		inputs: [
			{name: 'arg0', type: 'address'},
			{name: 'arg1', type: 'uint256'}
		],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'winners',
		inputs: [{name: 'arg0', type: 'uint256'}],
		outputs: [{name: '', type: 'address'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'winner_rate_providers',
		inputs: [{name: 'arg0', type: 'uint256'}],
		outputs: [{name: '', type: 'address'}]
	},
	{stateMutability: 'view', type: 'function', name: 'fee_token', inputs: [], outputs: [{name: '', type: 'address'}]},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'initial_fee',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	},
	{
		stateMutability: 'view',
		type: 'function',
		name: 'subsequent_fee',
		inputs: [],
		outputs: [{name: '', type: 'uint256'}]
	}
] as const;