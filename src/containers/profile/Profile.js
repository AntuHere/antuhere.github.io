import React, {lazy, Suspense} from "react";
import {contactInfo, greeting} from "../../portfolio";
import Loading from "../loading/Loading";

const GithubProfileCard = lazy(() =>
  import("../../components/githubProfileCard/GithubProfileCard")
);

export default function Profile() {
  if (!contactInfo.display) return null;
  // Preserve the existing profile/contact layout, using current CV information
  // rather than an older GitHub bio and a remotely hosted avatar.
  const profile = {
    name: greeting.name,
    bio: greeting.role,
    avatarUrl: greeting.photo,
    location: contactInfo.location
  };
  return (
    <Suspense fallback={<Loading />}>
      <GithubProfileCard prof={profile} />
    </Suspense>
  );
}
