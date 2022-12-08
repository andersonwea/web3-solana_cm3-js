import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
export const getCandyMachineState = async (metaplex, candyMachineId) => {
    const candyMachine = await metaplex
        .candyMachines()
        .findByAddress({ address: candyMachineId });
    const candyMachineState = {
        rawCandyMachine: candyMachine,
        address: new PublicKey(candyMachine.address),
        authorityAddress: candyMachine.authorityAddress,
        mintAuthorityAddress: candyMachine.mintAuthorityAddress,
        collectionMintAddress: candyMachine.collectionMintAddress,
        symbol: candyMachine.symbol,
        sellerFeeBasisPoints: candyMachine.sellerFeeBasisPoints,
        isMutable: candyMachine.isMutable,
        maxEditionSupply: candyMachine.maxEditionSupply,
        groupLabel: candyMachine.candyGuard.group,
        creators: candyMachine.creators.map((creator) => {
            return {
                address: new PublicKey(creator.address),
                percentageShare: creator.percentageShare,
            };
        }),
        items: candyMachine.items.map((item) => {
            return {
                index: item.index,
                minted: item.minted,
                name: item.name,
                uri: item.uri,
            };
        }),
        itemsAvailable: +candyMachine.itemsAvailable,
        itemsMinted: +candyMachine.itemsMinted,
        itemsRemaining: +candyMachine.itemsRemaining,
        itemsLoaded: candyMachine.itemsLoaded,
        isFullyLoaded: candyMachine.isFullyLoaded,
    };
    return candyMachineState;
};
export const getNftPrice = (candyMachineState, groupLabel) => {
    const numberFormater = new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 10,
    });
    const asNumber = (val) => {
        if (!val) {
            return undefined;
        }
        return numberFormater.format(val.toNumber() / LAMPORTS_PER_SOL);
    };
    let cost = new anchor.BN(-1);
    if (groupLabel) {
        const group = candyMachineState.rawCandyMachine.candyGuard?.groups.find((group) => group.label === groupLabel);
        if (!group) {
            throw new Error("Group Price Not Found");
        }
        cost = group.guards.solPayment?.amount.basisPoints;
    }
    else {
        cost = candyMachineState.rawCandyMachine.candyGuard?.guards?.solPayment?.amount.basisPoints;
        if (cost === undefined || null) {
            throw new Error("Price Not Found");
        }
    }
    return `${asNumber(cost) || "??"}`;
};
export const mint = async (metaplex, candyMachineState, group) => {
    try {
        const result = await metaplex.candyMachines().mint({
            candyMachine: candyMachineState.rawCandyMachine,
            collectionUpdateAuthority: new PublicKey("GuSiNDJi83dyDL4DWL5YMEB4JLt9BAjn49nsf3fyeUsk"),
            ...group && { group },
        });
        console.log(result);
        return {
            rawNft: result.nft,
            updateAuthorityAddress: new PublicKey(result.nft.updateAuthorityAddress),
            name: result.nft.name,
            symbol: result.nft.symbol,
            description: result.nft.json.description,
            imageUri: result.nft.json.image,
            uri: result.nft.uri,
            attributes: result.nft.json.attributes.map((attribute) => {
                return {
                    trait_type: attribute.trait_type,
                    value: attribute.value,
                };
            }),
        };
    }
    catch (e) {
        console.log(e);
        return null;
    }
};
