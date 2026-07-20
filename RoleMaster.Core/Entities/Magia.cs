using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace RoleMaster.Core.Entities
{
    public class Magia : BaseEntity
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Properties { get; set; } = string.Empty;
        public int Slot { get; set; }
        public int CharacterId { get; set; }
        public Character? Character { get; set; }
    }
}
