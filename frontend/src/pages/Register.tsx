import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Circle, Upload, X as XIcon, Loader2, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { WalletButton } from '@/components/molecules/WalletButton';
import { Avatar } from '@/components/atoms/Avatar';
import { pinataService, type UploadProgress } from '@/services/pinata.service';
import { xapiService, type XUserStats } from '@/services/xapi.service';
import { CONTRACT_ADDRESSES, TIPZ_PROFILE_ABI } from '@/services/contract.service';

const STORAGE_KEY = 'tipz_registration_progress';

const registrationSchema = z.object({
  walletConnected: z.boolean(),
  xData: z.object({
    username: z.string().min(1),
    name: z.string().min(1),
    followers: z.number().min(0),
    posts: z.number().min(0),
    replies: z.number().min(0),
  }).nullable(),
  imageFile: z.instanceof(File).nullable(),
  ipfsHash: z.string().nullable(),
});

type RegistrationData = z.infer<typeof registrationSchema>;

interface StepConfig {
  step: number;
  title: string;
  description: string;
}

const steps: StepConfig[] = [
  {
    step: 1,
    title: 'Connect Wallet',
    description: 'Connect your wallet to get started',
  },
  {
    step: 2,
    title: 'Connect X Account',
    description: 'Link your X (Twitter) account to verify your identity',
  },
  {
    step: 3,
    title: 'Upload Profile Image',
    description: 'Add a profile picture (stored on IPFS)',
  },
  {
    step: 4,
    title: 'Review & Submit',
    description: 'Review your profile and create it on-chain',
  },
];

function calculateCreditScore(followers: number, posts: number, replies: number): number {
  const followerScore = Math.min(followers / 10, 500);
  const engagementScore = Math.min((posts + replies * 1.5) / 5, 300);
  const ageScore = 100;

  return Math.round(followerScore + engagementScore + ageScore);
}

function getCreditScoreTier(score: number): { tier: string; color: string } {
  if (score >= 851) return { tier: '💎 Diamond', color: 'text-blue-600' };
  if (score >= 601) return { tier: '🥇 Gold', color: 'text-yellow-600' };
  if (score >= 301) return { tier: '🥈 Silver', color: 'text-gray-500' };
  return { tier: '🥉 Bronze', color: 'text-orange-600' };
}

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isConnected, address } = useAccount();

  const [currentStep, setCurrentStep] = useState(1);
  const [xData, setXData] = useState<XUserStats | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { handleSubmit } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      walletConnected: false,
      xData: null,
      imageFile: null,
      ipfsHash: null,
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.xData) setXData(data.xData);
        if (data.ipfsHash) setIpfsHash(data.ipfsHash);
        if (data.currentStep) setCurrentStep(data.currentStep);
      } catch (error) {
        console.error('Failed to restore registration progress:', error);
      }
    }

    const cachedXData = xapiService.getCachedUserData();
    if (cachedXData) {
      setXData(cachedXData);
    }
  }, []);

  useEffect(() => {
    // Check for OAuth errors first
    const oauthError = xapiService.checkOAuthError(searchParams);
    if (oauthError) {
      toast.error(oauthError);
      // Clean up URL
      globalThis.history.replaceState({}, '', '/register');
      return;
    }

    // Handle successful OAuth callback
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams]);

  useEffect(() => {
    const progress = {
      currentStep,
      xData,
      ipfsHash,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [currentStep, xData, ipfsHash]);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const userData = await xapiService.handleOAuthCallback(code, state);
      setXData(userData);
      setCurrentStep(3);
      toast.success('X account connected successfully!');

      globalThis.history.replaceState({}, '', '/register');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect X account';
      toast.error(message);
    }
  };

  const handleConnectX = async () => {
    try {
      // Validate configuration first
      const configValidation = xapiService.validateConfig();
      if (!configValidation.valid) {
        toast.error(configValidation.message || 'X API configuration error');
        return;
      }

      const authUrl = await xapiService.initiateOAuth();
      
      // Show loading toast
      toast.loading('Redirecting to X for authorization...', { duration: 2000 });
      
      // Redirect to X OAuth
      globalThis.location.href = authUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate X OAuth';
      toast.error(message);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = pinataService.validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid image');
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: 100, percentage: 0 });

    try {
      const result = await pinataService.uploadImage(imageFile, (progress) => {
        setUploadProgress(progress);
      });

      setIpfsHash(result.ipfsHash);
      toast.success('Image uploaded to IPFS successfully!');
      setCurrentStep(4);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSkipImage = () => {
    setCurrentStep(4);
  };

  // Use wagmi's useWriteContract directly for better control
  const { 
    writeContractAsync,
    isPending: isContractPending,
    data: txHash,
    reset: resetWrite
  } = useWriteContract();

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Watch for transaction confirmation
  useEffect(() => {
    if (isConfirmed && isSubmitting) {
      toast.dismiss('register-tx');
      toast.success('Profile created on-chain successfully!');
      
      // Clean up and show success modal
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY);
        xapiService.clearUserData();
        setShowSuccessModal(true);
        setIsSubmitting(false);
        resetWrite();
      }, 500);
    }
  }, [isConfirmed, isSubmitting, resetWrite]);

  const onSubmit = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!xData) {
      toast.error('Please connect your X account');
      return;
    }

    setIsSubmitting(true);

    try {
      // Show toast that transaction is being prepared
      toast.loading('Preparing transaction...', { id: 'register-tx' });
      
      // Prepare contract arguments
      const contractArgs = [
        xData.username,
        BigInt(xData.followers),
        BigInt(xData.posts),
        BigInt(xData.replies),
        ipfsHash || ''
      ];

      console.log('Submitting profile registration with args:', contractArgs);
      
      // Call the actual smart contract
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.tipzProfile,
        abi: TIPZ_PROFILE_ABI,
        functionName: 'registerProfile',
        args: contractArgs,
      });
      
      toast.loading('Transaction submitted! Waiting for confirmation...', { id: 'register-tx' });
      
      console.log('Profile registration transaction hash:', hash);
      
      // Success handling is done in useEffect above when isConfirmed changes
    } catch (error) {
      setIsSubmitting(false);
      toast.dismiss('register-tx');
      
      const message = error instanceof Error ? error.message : 'Failed to create profile';
      toast.error(message);
      console.error('Profile registration error:', error);
    }
  };

  const handleShareToX = () => {
    if (!xData) return;

    const shareText = xapiService.generateShareText({
      type: 'profile',
      username: xData.username,
    });

    const shareUrl = xapiService.getShareUrl(shareText);
    window.open(shareUrl, '_blank', 'width=550,height=420');
  };

  const creditScore = xData ? calculateCreditScore(xData.followers, xData.posts, xData.replies) : 0;
  const scoreTier = getCreditScoreTier(creditScore);

  return (
    <>
      <Helmet>
        <title>Register - Tipz</title>
        <meta name="description" content="Create your creator profile on Tipz" />
      </Helmet>

      <div className="min-h-screen bg-secondary py-xl">
        <div className="container mx-auto px-md max-w-4xl">
          <div className="text-center mb-xl">
            <h1 className="text-h1 font-bold mb-sm">Create Your Creator Profile</h1>
            <p className="text-body-lg text-primary/70">
              Join Tipz and start receiving tips from your supporters
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-xl">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isComplete = currentStep > step.step;
                const isActive = currentStep === step.step;

                return (
                  <div key={step.step} className="flex-1">
                    <div className="flex items-center">
                      <div
                        className={`
                          w-10 h-10 rounded-full border-3 flex items-center justify-center
                          ${isComplete ? 'bg-green-100 border-green-600' : ''}
                          ${isActive ? 'bg-brand border-primary' : ''}
                          ${!isComplete && !isActive ? 'bg-secondary border-primary/20' : ''}
                        `}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle
                            className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-primary/20'}`}
                          />
                        )}
                      </div>

                      {index < steps.length - 1 && (
                        <div
                          className={`flex-1 h-[3px] mx-2 ${
                            isComplete ? 'bg-green-600' : 'bg-primary/20'
                          }`}
                        />
                      )}
                    </div>

                    <div className="mt-xs">
                      <p className="text-body-sm font-medium">{step.title}</p>
                      <p className="text-caption text-primary/60 hidden md:block">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <Card variant="elevated" padding="lg">
            {/* Step 1: Connect Wallet */}
            {currentStep === 1 && (
              <div className="text-center py-xl">
                <h2 className="text-h3 font-bold mb-md">Connect Your Wallet</h2>
                <p className="text-body text-primary/70 mb-xl max-w-md mx-auto">
                  Connect your wallet to create your profile on Somnia Network. Your wallet address will
                  be linked to your creator profile.
                </p>

                {isConnected ? (
                  <div className="space-y-md">
                    <div className="inline-flex items-center gap-sm px-md py-sm bg-green-100 border-3 border-green-600 rounded-brutalist">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Wallet Connected</span>
                    </div>

                    <div>
                      <Button variant="brand" size="lg" onClick={() => setCurrentStep(2)}>
                        Continue to Next Step
                      </Button>
                    </div>
                  </div>
                ) : (
                  <WalletButton variant="brand" size="lg" />
                )}
              </div>
            )}

            {/* Step 2: Connect X */}
            {currentStep === 2 && (
              <div className="text-center py-xl">
                <h2 className="text-h3 font-bold mb-md">Connect Your X Account</h2>
                <p className="text-body text-primary/70 mb-xl max-w-md mx-auto">
                  Link your X (Twitter) account to verify your identity and calculate your credit score
                  based on your social metrics.
                </p>

                {xData ? (
                  <div className="space-y-md">
                    <div className="inline-flex items-center gap-sm px-md py-sm bg-green-100 border-3 border-green-600 rounded-brutalist">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Connected as @{xData.username}</span>
                    </div>

                    <div className="max-w-md mx-auto">
                      <Card variant="elevated" padding="md" className="text-left">
                        <p className="text-body-sm font-medium mb-sm">Your Stats:</p>
                        <div className="space-y-xs text-body-sm text-primary/70">
                          <div className="flex justify-between">
                            <span>Followers:</span>
                            <span className="font-medium text-primary">{xData.followers.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Posts:</span>
                            <span className="font-medium text-primary">{xData.posts.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Replies:</span>
                            <span className="font-medium text-primary">{xData.replies.toLocaleString()}</span>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div className="flex gap-sm justify-center">
                      <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                        Back
                      </Button>
                      <Button variant="brand" size="lg" onClick={() => setCurrentStep(3)}>
                        Continue to Next Step
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-md">
                    <Button variant="brand" size="lg" onClick={handleConnectX}>
                      <XIcon className="w-5 h-5 mr-2xs" />
                      Connect X Account
                    </Button>

                    <div>
                      <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                        Back
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Upload Image */}
            {currentStep === 3 && (
              <div className="py-xl">
                <h2 className="text-h3 font-bold mb-md text-center">Upload Profile Image</h2>
                <p className="text-body text-primary/70 mb-xl max-w-md mx-auto text-center">
                  Add a profile picture that will be stored on IPFS. Max size: 2MB. Formats: JPG, PNG, WebP.
                </p>

                <div className="max-w-md mx-auto space-y-md">
                  {imagePreview ? (
                    <div className="text-center space-y-md">
                      <Avatar
                        src={imagePreview}
                        alt="Profile preview"
                        size="xl"
                        className="mx-auto"
                      />

                      {uploadProgress && (
                        <div>
                          <div className="flex justify-between text-body-sm mb-xs">
                            <span>Uploading...</span>
                            <span>{uploadProgress.percentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-accent border-2 border-primary rounded-brutalist overflow-hidden">
                            <div
                              className="h-full bg-brand transition-all duration-300"
                              style={{ width: `${uploadProgress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {!ipfsHash && !isUploading && (
                        <div className="flex gap-sm justify-center">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          >
                            Change Image
                          </Button>
                          <Button
                            variant="brand"
                            onClick={handleUploadImage}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2xs animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2xs" />
                                Upload to IPFS
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {ipfsHash && (
                        <div className="space-y-md">
                          <div className="inline-flex items-center gap-sm px-md py-sm bg-green-100 border-3 border-green-600 rounded-brutalist">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-body-sm">Uploaded to IPFS</span>
                          </div>

                          <div className="flex gap-sm justify-center">
                            <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                              Back
                            </Button>
                            <Button variant="brand" onClick={() => setCurrentStep(4)}>
                              Continue to Review
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="image-upload"
                        className="block cursor-pointer"
                      >
                        <Card
                          variant="elevated"
                          padding="lg"
                          className="hover:bg-accent transition-colors text-center"
                        >
                          <Upload className="w-12 h-12 mx-auto mb-sm text-primary/40" />
                          <p className="text-body font-medium mb-xs">Click to upload image</p>
                          <p className="text-body-sm text-primary/60">
                            JPG, PNG or WebP (max 2MB)
                          </p>
                        </Card>
                      </label>

                      <input
                        id="image-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />

                      <div className="flex gap-sm justify-center mt-md">
                        <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                          Back
                        </Button>
                        <Button variant="primary" onClick={handleSkipImage}>
                          Skip for Now
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="py-xl">
                <h2 className="text-h3 font-bold mb-md text-center">Review Your Profile</h2>
                <p className="text-body text-primary/70 mb-xl max-w-md mx-auto text-center">
                  Review your profile details before creating it on-chain.
                </p>

                <div className="max-w-lg mx-auto space-y-lg">
                  {/* Profile Preview */}
                  <Card variant="elevated" padding="lg">
                    <div className="flex items-start gap-md">
                      <Avatar
                        src={imagePreview || undefined}
                        alt={`${xData?.username} profile`}
                        fallbackText={xData?.username?.slice(0, 2).toUpperCase() || 'U'}
                        size="lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-h4 font-bold">@{xData?.username}</h3>
                        <p className="text-body text-primary/70">{xData?.name}</p>

                        <div className="mt-md space-y-xs">
                          <div className="flex justify-between text-body-sm">
                            <span className="text-primary/70">Credit Score:</span>
                            <span className={`font-bold ${scoreTier.color}`}>
                              {creditScore}/1000 {scoreTier.tier}
                            </span>
                          </div>
                          <div className="flex justify-between text-body-sm">
                            <span className="text-primary/70">Followers:</span>
                            <span className="font-medium">{xData?.followers.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-body-sm">
                            <span className="text-primary/70">Posts:</span>
                            <span className="font-medium">{xData?.posts.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-body-sm">
                            <span className="text-primary/70">Wallet:</span>
                            <span className="font-mono text-caption">
                              {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Credit Score Breakdown */}
                  <Card variant="elevated" padding="md">
                    <p className="text-body-sm font-bold mb-sm">Credit Score Calculation:</p>
                    <div className="space-y-xs text-body-sm text-primary/70">
                      <div className="flex justify-between">
                        <span>Follower Score (50%):</span>
                        <span className="font-medium text-primary">
                          {Math.min(xData?.followers || 0 / 10, 500)} pts
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Engagement Score (30%):</span>
                        <span className="font-medium text-primary">
                          {Math.min(((xData?.posts || 0) + (xData?.replies || 0) * 1.5) / 5, 300)} pts
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Account Age (20%):</span>
                        <span className="font-medium text-primary">100 pts</span>
                      </div>
                      <div className="flex justify-between pt-xs border-t-2 border-primary/20">
                        <span className="font-bold text-primary">Total Score:</span>
                        <span className={`font-bold ${scoreTier.color}`}>{creditScore} pts</span>
                      </div>
                    </div>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-sm justify-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => setCurrentStep(3)} 
                      disabled={isSubmitting || isContractPending || isConfirming}
                    >
                      Back
                    </Button>
                    <Button
                      variant="brand"
                      size="lg"
                      onClick={handleSubmit(onSubmit)}
                      disabled={isSubmitting || isContractPending || isConfirming}
                      isLoading={isSubmitting || isContractPending || isConfirming}
                    >
                      {(() => {
                        if (isContractPending) return 'Confirm in Wallet...';
                        if (isConfirming) return 'Confirming Transaction...';
                        if (isSubmitting) return 'Preparing...';
                        return 'Create Profile';
                      })()}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-primary/50">
          <Card variant="elevated" padding="lg" className="max-w-md w-full bg-secondary p-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 border-3 border-green-600 rounded-brutalist mb-md">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              <h2 className="text-h2 font-bold mb-sm">Profile Created On-Chain!</h2>
              <p className="text-body text-primary/70 mb-xl">
                Your Tipz profile is now live on Somnia blockchain! Share it with your supporters and start receiving tips.
              </p>

              <div className="space-y-sm">
                <Button variant="brand" size="lg" className="w-full" onClick={handleShareToX}>
                  <Share2 className="w-5 h-5 mr-2xs" />
                  Share on X
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
