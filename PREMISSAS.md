# Premissas adotadas

Itens não especificados nos anexos ou no pedido. Revise antes da implantação.

## Fontes
- **Planilha MAMUTE_FROTAS.xls**: campos de Veículo (21 colunas) e Pneu (15 colunas) usados nos cadastros, com os nomes e a ordem originais.
- **Modelo MAMUTE_TEMPLETE.docx**: seções do parecer (dados do veículo, 4 fotografias, dados do pneu, dados da avaria, análise técnica, conclusão técnica, parecer final e perda/prejuízo).
- **Logo**: versão completa (cabeçalho do login e menu) e ícone (barra superior, cabeçalho do parecer e favicon). Cores extraídas da logo: azul-marinho e azul-elétrico.

## Campos adicionados além da planilha
- **Veículo**: `km_atual` (odômetro), necessário para vencimentos da preventiva e consumo de combustível. Também `status`.
- **Pneu**: `fogo` (nº de série) e `dot` (semana/ano de fabricação), presentes no modelo do parecer; `status`, `veiculo_id` e `posicao` para vincular o pneu ao veículo.

## Regras de negócio
- **Acesso**: login por e-mail e senha (Supabase Auth). Todos os usuários autenticados acessam todos os módulos. Perfis `admin` e `operador` existem no banco, mas a segregação de telas por perfil ainda não foi implementada.
- **Parecer final**: seleção única, conforme as opções do modelo. O modelo lista as opções em grupos, o que pode indicar mais de uma marcação. Se for necessário marcar mais de uma, ajuste para múltipla escolha.
- **Perda (prejuízo)**: seleção única entre Aprovado, Não aprovado e Arquivar.
- **Parecer**: o número (Nº) é sequencial automático. Os dados do veículo e do pneu são gravados como snapshot no momento da emissão, para que alterações futuras no cadastro não mudem pareceres antigos.
- **Status do parecer**: `rascunho` pode ser salvo a qualquer momento. Emitir exige análise, conclusão, parecer final e decisão de perda.
- **Textos-padrão**: a análise e a conclusão oferecem texto-base com os campos de avaria e causa. Ele é apenas sugestão e pode ser editado livremente.
- **Preventiva**: vence pelo que ocorrer primeiro entre km (a partir do `km_atual`) e dias. O alerta "a vencer" considera 10% do intervalo de km (mínimo de 500 km) ou 15 dias.
- **Mobilização**: registrar mobilização define o veículo como *mobilizado*. A desmobilização define *desmobilizado*.
- **Combustível**: km/L calculado entre abastecimentos consecutivos do mesmo veículo com km crescente.
- **Km do veículo**: sobe automaticamente quando vistoria, OS, preventiva, mobilização ou abastecimento informam km maior que o atual. Nunca diminui.
- **Sulco**: informar a profundidade em uma vistoria atualiza o cadastro do pneu.
- **Produtos**: cadastro com estoque atual e mínimo, com alerta visual. Não há movimentação automática de estoque a partir das OS nesta versão.
- **Fotos**: armazenadas no bucket privado `vistorias`, com links temporários (1 hora). Remover uma foto apenas a desvincula do parecer; o arquivo permanece no storage.

## Técnicos
- Valores monetários em BRL (pt-BR) e datas em `dd/mm/aaaa`.
- Exclusões pedem confirmação. Não há lixeira nem histórico de auditoria.
- A migração SQL precisa ser executada manualmente no SQL Editor (ver README).
