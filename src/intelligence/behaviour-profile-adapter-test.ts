import { getBehaviourProfile } from "../storage/behaviour-profile-repository";

import { profileToBehaviour } from "./behaviour-profile-adapter";

export async function testBehaviourProfileAdapter() {
  const profile = await getBehaviourProfile("Profile Test App");

  if (!profile) {
    console.log("No profile available for adapter test.");

    return;
  }

  const behaviour = profileToBehaviour(profile, 15);

  console.log("Profile-adapted behaviour:");

  console.log(behaviour);
}
