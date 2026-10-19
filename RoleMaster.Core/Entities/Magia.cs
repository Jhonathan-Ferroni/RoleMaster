using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RoleMaster.Core.Entities
{
    public class Magia : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Properties { get; set; } = string.Empty;
        public int Slot { get; set; }
        public int CharacterId { get; set; }
        [JsonIgnore]
        public Character? Character { get; set; }
    }
}
