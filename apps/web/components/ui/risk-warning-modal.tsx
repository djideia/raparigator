"use client";

import { Button } from "./button";
import { Modal } from "./modal";

interface RiskWarningModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetLabel: string;
  messageCopied?: boolean;
}

export function RiskWarningModal({
  open,
  onClose,
  onConfirm,
  targetLabel,
  messageCopied = false,
}: RiskWarningModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🛡️ Aviso de Segurança"
      description={`Você está prestes a sair da Sigillus em direção ao ${targetLabel}. Conversas fora da plataforma não contam com nossos recursos de segurança — apelido, bloqueio e denúncia.`}
      actions={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Voltar com Segurança
          </Button>
          <Button variant="primary" fullWidth onClick={onConfirm}>
            Entendi, Continuar
          </Button>
        </>
      }
    >
      {messageCopied ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm leading-relaxed text-emerald-800">
          📋 Sua mensagem foi copiada. O {targetLabel} não aceita texto pronto no link, então é só
          colar na conversa.
        </p>
      ) : null}
    </Modal>
  );
}
