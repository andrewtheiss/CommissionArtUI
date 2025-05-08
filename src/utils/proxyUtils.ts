import { ethers } from 'ethers';

/**
 * Creates a minimal proxy (EIP-1167) clone of a template contract
 * @param templateAddress The address of the template contract to clone
 * @param signer The signer to use for the transaction
 * @returns Object containing the transaction and the address of the deployed proxy
 */
export async function createMinimalProxy(
  templateAddress: string,
  signer: ethers.JsonRpcSigner
): Promise<{ tx: ethers.TransactionResponse; proxyAddress: string }> {
  // The bytecode for a minimal proxy (EIP-1167)
  // This is the bytecode that will deploy a proxy pointing to the template
  const proxyBytecode = `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${templateAddress.slice(2)}5af43d82803e903d91602b57fd5bf3`;
  
  // Create a transaction to deploy the proxy
  const tx = await signer.sendTransaction({
    data: proxyBytecode,
    gasLimit: 500000
  });
  
  // Calculate the proxy address using CREATE operation
  // This is a deterministic calculation based on the sender and nonce
  const signerAddress = await signer.getAddress();
  const nonce = await signer.provider.getTransactionCount(signerAddress, 'pending');
  const proxyAddress = ethers.getCreateAddress({
    from: signerAddress,
    nonce: nonce - 1 // The nonce used for the transaction we just sent
  });
  
  return { tx, proxyAddress };
} 