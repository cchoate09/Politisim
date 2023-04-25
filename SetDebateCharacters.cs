using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class SetDebateCharacters : MonoBehaviour
{
    public List<Sprite> charactersToChoose = new List<Sprite>();
    public List<Image> candidates = new List<Image>();
    public List<int> indices = new List<int>();
    public List<TextMeshProUGUI> namesToSet = new List<TextMeshProUGUI>();
    public List<string> names = new List<string>();
    // Start is called before the first frame update
    void Start()
    {
        indices.Add((int)Variables.Saved.Get("Character1"));
        indices.Add((int)Variables.Saved.Get("Character2"));
        indices.Add((int)Variables.Saved.Get("Character3"));
        indices.Add((int)Variables.Saved.Get("Character4"));
        for (int i = 0; i < indices.Count; i++)
        {
            candidates[i].sprite = charactersToChoose[indices[i]];
        }
        names.Add((string)Variables.Saved.Get("Name1"));
        names.Add((string)Variables.Saved.Get("Name2"));
        names.Add((string)Variables.Saved.Get("Name3"));
        names.Add((string)Variables.Saved.Get("Name4"));
        for (int i = 0; i < indices.Count; i++)
        {
            namesToSet[i].text = names[i];
        }
    }

}
