using Microsoft.AspNetCore.SignalR;
using RoleMaster.Core.Entities;

namespace RoleMaster.API.Hubs;

public class CampanhaHub : Hub
{
    // Quando qualquer um entra na tela da campanha, ele é adicionado a um "Quarto" exclusivo daquela mesa
    public async Task EntrarNaMesa(string mesaId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, mesaId);
    }

    // O Mestre clica na imagem da cena, e o servidor espalha para os jogadores daquela mesa
    public async Task TrocarCena(string mesaId, string urlMidia)
    {
        await Clients.Group(mesaId).SendAsync("ReceberNovaCena", urlMidia);
    }

    // O Mestre toca uma música
    public async Task TocarMusica(string mesaId, string urlMusica)
    {
        await Clients.Group(mesaId).SendAsync("ReceberMusica", urlMusica);
    }

    // O Mestre clica no botão "Iniciar Encontro" e envia a lista de quem entra e quem assiste
    public async Task IniciarEncontro(string mesaId, Dictionary<string, StatusJogadorEncontro> statusJogadores)
    {
        await Clients.Group(mesaId).SendAsync("EncontroIniciado", statusJogadores);
    }

    // O Mestre puxa um jogador atrasado para o meio do combate
    public async Task AtualizarStatusJogador(string mesaId, string usuarioId, StatusJogadorEncontro novoStatus)
    {
        await Clients.Group(mesaId).SendAsync("StatusJogadorAtualizado", usuarioId, novoStatus);
    }
}