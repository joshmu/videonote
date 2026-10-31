import { ModalType } from "@/components/Modals/Modals";
import { useProjectsContext } from "@/context/projectsContext";
import { useSessionContext } from "@/context/sessionContext";
import { useUiShellContext } from "@/context/uiShellContext";
import { ModalPrimaryBtn } from "@/shared/Modal/ModalBtn";
import { Heading2 } from "@/shared/Text/Text";

// A signed-in User with no Project yet has nothing else on screen to act on.
export const FirstProjectPrompt = () => {
  const { admin } = useSessionContext();
  const { project } = useProjectsContext();
  const { toggleModalOpen } = useUiShellContext();

  if (!admin || project) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
      <Heading2>Start with a video</Heading2>
      <p className="max-w-sm text-themeText2">
        Create a Project from a link, then add a timestamped Note whenever something needs a change.
      </p>
      <ModalPrimaryBtn handleClick={() => toggleModalOpen(ModalType.CREATE_PROJECT)}>
        Create Project
      </ModalPrimaryBtn>
    </div>
  );
};
