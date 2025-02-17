import { GetServerSideProps } from "next";
import { DiscordUser } from "../utils/types";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useToast } from '../hooks/useToast';
import { ClaimRes } from '../interfaces'

interface Props {
  user: DiscordUser;
}

export default function Index(props: Props) {
  const [canClaim, setCanClaim] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claimStatus, setClaimStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast(3000);

  const txSubmittedCallback = txid => {
    console.log("txSubmittedCallback")
    setClaimed(true)
    setCanClaim(false)
  }

  const checkClaimStatus = async () => {
    const claimRes: ClaimRes = await fetch('/api/checkclaim').then(res => {
      return res.json()
    }).then(json => json)

    setClaimStatus(claimRes.error)
    setClaimed(claimRes.claim.claimed)
    if(claimRes.claim.whitelisted === true) {
      if(claimRes.claim.claimed === false) {
        toast('success', claimRes.error)
        setCanClaim(true)
        setClaimed(false)
      } else if(claimRes.claim.claimed === true) {
        toast('error', claimRes.error)
        setCanClaim(false)
        setClaimed(true)
      }
    } 
  }

  const checkClaim = async () => {
    setLoading(true)    
    const claimRes: ClaimRes = await fetch('/api/toclaim').then(res => {
      return res.json()
    }).then(json => json)
    console.log(claimRes)
    console.log(claimRes)
    if(claimRes.claim.whitelisted === true) {
      if(claimRes.claim.claimed === false) {
        toast('success', 'You have unclaimed tokens!')
        setCanClaim(true)
        setClaimed(false)
      } else if(claimRes.claim.claimed === true) {
        toast('error', 'You already claimed your tokens!')
        setCanClaim(false)
        setClaimed(true)
      }
    } 
    setLoading(false)
  }

  const WalletConnect = dynamic(() => import(`../components/WalletConnect`), {
    ssr: false,
  });
  useEffect(() => {
    checkClaim()

    return () => {
      setCanClaim(false)
      setLoading(false)
    }
  }, [])

  return (
    <>
      <h1>
        Hey, {props.user.username}#{props.user.discriminator}
      </h1>
        {/* <div className="flex items-center justify-center space-x-2">
          <div className="spinner-border animate-spin inline-block w-4 h-4 border-1 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div> */}
      {loading ?
      <>
      <div className="flex items-center justify-center space-x-2">
        <div className="spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0 text-blue-300" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
      </>
      : ''}
      {canClaim ? 
        <>
          <h2>{claimStatus === '' ? "You have unclaimed tokens! ✨ 🎈" : claimStatus}</h2>
          <WalletConnect successCallback={txSubmittedCallback}/>
        </>
        : 
        <h2>{claimStatus === '' ? "Nothing to claim right now 😿" : claimStatus}</h2>
      }
      {claimed ? <button onClick={checkClaimStatus}>Didn't receieve the last claim?</button> : <></>}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async function (ctx) {
  
  const { parseUser } = await import( "../utils/parse-user")
  
  const user = parseUser(ctx);

  if (!user) {
    return {
      redirect: {
        destination: "/api/oauth",
        permanent: false,
      },
    };
  }

  return { props: { user } };
};
