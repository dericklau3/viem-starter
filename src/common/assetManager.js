import { parseEther } from 'viem';

export async function transferEth(walletClient, account, to, amount) {
    return await walletClient.sendTransaction({
        account: account,
        to: to,
        value: parseEther(amount),
    });
}

export async function balanceOf(publicClient, address) {
    return await publicClient.getBalance({ address: address });
}

export async function multiBalanceOf(publicClient, addresses) {
    const balancePromises = addresses.map(address => 
        publicClient.getBalance({ address })
    );
    
    return Promise.all(balancePromises);
}