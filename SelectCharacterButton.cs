using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class SelectCharacterButton : MonoBehaviour
{
    public Button mButton;
    public GameObject activate;
    public GameObject deactivate;
    public SelectCharacterCompanion scc;
    public TextMeshProUGUI t;
    public string userName = "Player";
    public int charSelected = 0;
    public HashSet<int> hs = new HashSet<int>();
    public TextAsset txt;
    public List<string> lines;
    public HashSet<int> hs_name = new HashSet<int>();

    // Start is called before the first frame update
    void Start()
    {
        TextAsset txt = (TextAsset)Resources.Load("LastNames", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        mButton.onClick.AddListener(onButtonClick);
    }

    void onButtonClick()
    {
        Variables.Saved.Set("Character", scc.index);
        string curName = t.text;
        if (curName.Length > 0)
        {
            Variables.Saved.Set("CharacterName", curName);
        }
        else
        {
            Variables.Saved.Set("CharacterName", userName);
        }
        hs.Add(scc.index);
        List<int> charSelections = new List<int>();
        for (int i = 0; i < 5; i++)
        {
            int r = Random.Range(0, 10);
            while (hs.Contains(r))
            {
                r = Random.Range(0, 10);
            }
            charSelections.Add(r);
            hs.Add(r);
        }
        List<string> nameSelections = new List<string>();
        List<string> title = new List<string>();
        title.Add("Gov.");
        title.Add("Sen.");
        title.Add("Rep.");
        title.Add("Sec.");
        for (int i = 0; i < 5; i++)
        {
            int r = Random.Range(0, lines.Count);
            int s = Random.Range(0, title.Count);
            while (hs_name.Contains(r))
            {
                r = Random.Range(0, lines.Count);
            }
            nameSelections.Add(title[s] + " " + lines[r]);
            hs_name.Add(r);
        }
        Variables.Saved.Set("Character1", charSelections[0]);
        Variables.Saved.Set("Character2", charSelections[1]);
        Variables.Saved.Set("Character3", charSelections[2]);
        Variables.Saved.Set("Character4", charSelections[3]);
        Variables.Saved.Set("GeneralCharacter", charSelections[4]);
        Variables.Saved.Set("Name1", nameSelections[0]);
        Variables.Saved.Set("Name2", nameSelections[1]);
        Variables.Saved.Set("Name3", nameSelections[2]);
        Variables.Saved.Set("Name4", nameSelections[3]);
        Variables.Saved.Set("NameGeneral", nameSelections[4]);
        activate.SetActive(true);
        deactivate.SetActive(false);
    }

}
